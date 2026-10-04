import { NetworkMode } from '../types';

type NetworkChangeListener = (isOnline: boolean, mode: NetworkMode) => void;

class NetworkManager {
  private mode: NetworkMode = 'auto';
  private realOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkChangeListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.realOnline = true;
        this.notify();
      });

      window.addEventListener('offline', () => {
        this.realOnline = false;
        this.notify();
      });
    }
  }

  public isOnline(): boolean {
    if (this.mode === 'offline') return false;
    if (this.mode === 'online') return true;
    if (this.mode === 'flaky') {
      // 50% chance of failing
      return Math.random() > 0.45;
    }
    return this.realOnline;
  }

  public getEffectiveOnlineState(): boolean {
    if (this.mode === 'offline') return false;
    if (this.mode === 'online') return true;
    return this.realOnline;
  }

  public getMode(): NetworkMode {
    return this.mode;
  }

  public setMode(mode: NetworkMode) {
    this.mode = mode;
    this.notify();
  }

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getEffectiveOnlineState(), this.mode);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const effective = this.getEffectiveOnlineState();
    this.listeners.forEach((l) => l(effective, this.mode));
  }

  /**
   * Helper that simulates latency or network failure based on mode
   */
  public async simulateNetworkDelay(): Promise<void> {
    if (this.mode === 'slow') {
      await new Promise((r) => setTimeout(r, 1200));
    } else {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}

export const networkManager = new NetworkManager();
