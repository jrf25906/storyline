export class VoiceStreamingService {
  private ws: any;

  constructor() {
    this.ws = null;
  }

  connect(url: string): void {
    // Mock WebSocket connection
    this.ws = {
      send: (data: any) => {},
      close: () => {},
      on: (event: string, callback: Function) => {},
      readyState: 1
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws) {
      this.ws.send(data);
    }
  }

  on(event: string, callback: Function): void {
    if (this.ws) {
      this.ws.on(event, callback);
    }
  }
}