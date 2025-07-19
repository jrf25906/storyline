/**
 * Network service interfaces for monitoring connectivity and offline queue
 */

import { Result } from '@services/interfaces/common/result';

// Main network service
export interface INetworkService {
  // Connection status
  getCurrentStatus(): Promise<Result<NetworkStatus>>;
  isOnline(): Promise<Result<boolean>>;
  getConnectionType(): Promise<Result<'wifi' | 'cellular' | 'none' | 'unknown'>>;
  
  // Network quality
  getNetworkQuality(): Promise<Result<NetworkQualityMetrics | null>>;
  
  // Real-time monitoring
  onStatusChange(callback: (status: NetworkStatus) => void): () => void;
  
  // Connection management
  waitForConnection(timeout?: number): Promise<Result<void>>;
  testConnectivity(url?: string): Promise<Result<boolean>>;
}

export interface NetworkStatus {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  details?: {
    isInternetReachable?: boolean;
    isWifiEnabled?: boolean;
    strength?: number;
    ipAddress?: string;
    subnet?: string;
  };
  quality?: NetworkQualityMetrics;
}

export interface NetworkQualityMetrics {
  latency: number; // milliseconds
  bandwidth: number; // Mbps
  packetLoss: number; // percentage
  jitter: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

// Offline queue service
export interface IOfflineQueueService {
  // Queue management
  queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'attempts'>): Promise<Result<string>>;
  getQueuedRequests(): Promise<Result<QueuedRequest[]>>;
  removeFromQueue(requestId: string): Promise<Result<void>>;
  clearQueue(): Promise<Result<void>>;
  
  // Processing
  processQueue(): Promise<Result<number>>; // Returns number of processed requests
  
  // Retry policies
  getRetryPolicy(priority: RequestPriority): RetryPolicy;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  priority: RequestPriority;
  timestamp: Date;
  attempts: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export type RequestPriority = 'critical' | 'high' | 'normal' | 'low';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
}