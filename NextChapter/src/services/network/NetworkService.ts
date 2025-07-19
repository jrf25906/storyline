/**
 * Network service implementation for monitoring connectivity
 * and managing offline queues
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { 
  INetworkService,
  IOfflineQueueService,
  NetworkStatus,
  QueuedRequest,
  RequestPriority,
  RetryPolicy,
  NetworkQualityMetrics
} from '@services/interfaces/network/INetworkService';
import { IStorageService } from '@services/interfaces/data/IStorageService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { NetworkError, OfflineError } from '@services/interfaces/common/errors';
import { services } from '@services/ServiceContainer';

export class NetworkService implements INetworkService, IOfflineQueueService {
  private networkState: NetworkStatus;
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private unsubscribeNetInfo: (() => void) | null = null;
  private queue: QueuedRequest[] = [];
  private processingQueue = false;
  private readonly QUEUE_KEY = '@next_chapter/offline_queue';
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly QUEUE_PROCESS_INTERVAL = 30000; // 30 seconds
  private queueInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.networkState = {
      isConnected: true,
      type: 'unknown',
      details: {
        isInternetReachable: true,
        isWifiEnabled: false,
        strength: 0,
        ipAddress: undefined,
        subnet: undefined,
      }
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load queued requests from storage
    await this.loadQueue();

    // Start monitoring network state
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);

    // Get initial state
    const state = await NetInfo.fetch();
    this.handleNetworkChange(state);

    // Start queue processing
    this.startQueueProcessing();
  }

  private handleNetworkChange = (state: NetInfoState): void => {
    const previousState = this.networkState;
    
    this.networkState = {
      isConnected: state.isConnected ?? false,
      type: state.type as any,
      details: {
        isInternetReachable: state.isInternetReachable ?? false,
        isWifiEnabled: state.type === 'wifi',
        strength: this.getSignalStrength(state),
        ipAddress: state.details?.ipAddress,
        subnet: state.details?.subnet,
      }
    };

    // Calculate quality metrics
    this.networkState.quality = this.calculateQuality(state);

    // Notify listeners if connection state changed
    if (previousState.isConnected !== this.networkState.isConnected) {
      this.notifyListeners();

      // Process queue when coming back online
      if (this.networkState.isConnected && !previousState.isConnected) {
        this.processQueue();
      }
    }
  };

  // INetworkService implementation
  async getCurrentStatus(): Promise<Result<NetworkStatus>> {
    return ok(this.networkState);
  }

  async isOnline(): Promise<Result<boolean>> {
    return ok(this.networkState.isConnected && (this.networkState.details?.isInternetReachable ?? false));
  }

  async getConnectionType(): Promise<Result<'wifi' | 'cellular' | 'none' | 'unknown'>> {
    return ok(this.networkState.type);
  }

  async getNetworkQuality(): Promise<Result<NetworkQualityMetrics | null>> {
    if (!this.networkState.quality) {
      return ok(null);
    }
    return ok(this.networkState.quality);
  }

  onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async waitForConnection(timeout?: number): Promise<Result<void>> {
    return new Promise((resolve) => {
      if (this.networkState.isConnected) {
        resolve(ok(undefined));
        return;
      }

      let timeoutHandle: NodeJS.Timeout | null = null;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (unsubscribe) unsubscribe();
      };

      // Set up connection listener
      unsubscribe = this.onStatusChange((status) => {
        if (status.isConnected) {
          cleanup();
          resolve(ok(undefined));
        }
      });

      // Set up timeout if specified
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          cleanup();
          resolve(err(new NetworkError('Connection timeout')));
        }, timeout);
      }
    });
  }

  async testConnectivity(url?: string): Promise<Result<boolean>> {
    return tryCatch(
      async () => {
        const testUrl = url || 'https://www.google.com';
        
        try {
          const response = await fetch(testUrl, {
            method: 'HEAD',
            cache: 'no-cache',
          });
          
          return response.ok;
        } catch (error) {
          return false;
        }
      },
      (error) => new NetworkError(`Connectivity test failed: ${error}`)
    );
  }

  // IOfflineQueueService implementation
  async queueRequest(
    request: Omit<QueuedRequest, 'id' | 'timestamp' | 'attempts'>
  ): Promise<Result<string>> {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      return err(new NetworkError('Offline queue is full'));
    }

    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: new Date(),
      attempts: 0,
    };

    this.queue.push(queuedRequest);
    
    // Sort by priority
    this.sortQueue();
    
    // Persist queue
    await this.saveQueue();

    // Try to process immediately if online
    if (this.networkState.isConnected) {
      this.processQueue();
    }

    return ok(queuedRequest.id);
  }

  async getQueuedRequests(): Promise<Result<QueuedRequest[]>> {
    return ok([...this.queue]);
  }

  async removeFromQueue(requestId: string): Promise<Result<void>> {
    const index = this.queue.findIndex(r => r.id === requestId);
    
    if (index === -1) {
      return err(new NetworkError(`Request ${requestId} not found in queue`));
    }

    this.queue.splice(index, 1);
    await this.saveQueue();
    
    return ok(undefined);
  }

  async clearQueue(): Promise<Result<void>> {
    this.queue = [];
    await this.saveQueue();
    return ok(undefined);
  }

  async processQueue(): Promise<Result<number>> {
    if (this.processingQueue) {
      return ok(0);
    }

    if (!this.networkState.isConnected) {
      return err(new OfflineError('Cannot process queue while offline'));
    }

    this.processingQueue = true;
    let processed = 0;

    try {
      const toProcess = [...this.queue];
      
      for (const request of toProcess) {
        const shouldRetry = this.shouldRetry(request);
        
        if (!shouldRetry) {
          // Remove from queue if max retries exceeded
          await this.removeFromQueue(request.id);
          continue;
        }

        try {
          // Execute the request
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });

          if (response.ok || (response.status >= 400 && response.status < 500)) {
            // Success or client error - remove from queue
            await this.removeFromQueue(request.id);
            processed++;

            // Call success callback if provided
            if (request.onSuccess) {
              try {
                request.onSuccess(await response.json());
              } catch (e) {
                // Ignore callback errors
              }
            }
          } else {
            // Server error - increment attempts
            request.attempts++;
            await this.saveQueue();
          }
        } catch (error) {
          // Network error - increment attempts
          request.attempts++;
          await this.saveQueue();

          // Call error callback if provided
          if (request.onError) {
            try {
              request.onError(error);
            } catch (e) {
              // Ignore callback errors
            }
          }
        }

        // Delay between requests to avoid overwhelming the server
        await this.delay(1000);
      }

      return ok(processed);
    } finally {
      this.processingQueue = false;
    }
  }

  getRetryPolicy(priority: RequestPriority): RetryPolicy {
    switch (priority) {
      case 'critical':
        return {
          maxAttempts: 10,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
        };
      case 'high':
        return {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffFactor: 2,
        };
      case 'normal':
        return {
          maxAttempts: 3,
          baseDelay: 5000,
          maxDelay: 120000,
          backoffFactor: 2,
        };
      case 'low':
        return {
          maxAttempts: 2,
          baseDelay: 10000,
          maxDelay: 300000,
          backoffFactor: 3,
        };
    }
  }

  // Helper methods
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.networkState));
  }

  private getSignalStrength(state: NetInfoState): number {
    // This is a simplified implementation
    // In a real app, you might use platform-specific APIs
    if (state.type === 'wifi' && state.details?.strength) {
      return state.details.strength;
    }
    
    if (state.type === 'cellular' && state.details?.cellularGeneration) {
      const generations: Record<string, number> = {
        '2g': 25,
        '3g': 50,
        '4g': 75,
        '5g': 100,
      };
      return generations[state.details.cellularGeneration] || 0;
    }
    
    return 0;
  }

  private calculateQuality(state: NetInfoState): NetworkQualityMetrics {
    // This is a simplified quality calculation
    const base: NetworkQualityMetrics = {
      latency: 0,
      bandwidth: 0,
      packetLoss: 0,
      jitter: 0,
      effectiveType: 'unknown',
    };

    if (!state.isConnected) {
      return base;
    }

    // Estimate based on connection type
    if (state.type === 'wifi') {
      base.latency = 20;
      base.bandwidth = 50; // Mbps
      base.effectiveType = '4g';
    } else if (state.type === 'cellular') {
      const generation = state.details?.cellularGeneration;
      switch (generation) {
        case '5g':
          base.latency = 10;
          base.bandwidth = 100;
          base.effectiveType = '4g';
          break;
        case '4g':
          base.latency = 30;
          base.bandwidth = 25;
          base.effectiveType = '4g';
          break;
        case '3g':
          base.latency = 100;
          base.bandwidth = 2;
          base.effectiveType = '3g';
          break;
        default:
          base.latency = 300;
          base.bandwidth = 0.1;
          base.effectiveType = 'slow-2g';
      }
    }

    return base;
  }

  private async loadQueue(): Promise<void> {
    try {
      const storage = services.storage;
      const result = await storage.get<QueuedRequest[]>(this.QUEUE_KEY);
      
      if (result.isOk() && result.value) {
        this.queue = result.value.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
        this.sortQueue();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const storage = services.storage;
      await storage.set(this.QUEUE_KEY, this.queue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private sortQueue(): void {
    const priorityOrder: Record<RequestPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    this.queue.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (older first)
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private shouldRetry(request: QueuedRequest): boolean {
    const policy = this.getRetryPolicy(request.priority);
    return request.attempts < policy.maxAttempts;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startQueueProcessing(): void {
    // Process queue periodically
    this.queueInterval = setInterval(() => {
      if (this.networkState.isConnected && this.queue.length > 0) {
        this.processQueue();
      }
    }, this.QUEUE_PROCESS_INTERVAL);
  }

  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }

    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }

    this.listeners = [];
  }
}