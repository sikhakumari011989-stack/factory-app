import { OfflinePunchQueueItem, TimePunch } from '../types';

const QUEUE_STORAGE_KEY = 'factory_pwa_offline_punch_queue';

export class OfflineQueueManager {
  /**
   * Get all queued punches waiting for sync
   */
  static getQueue(): OfflinePunchQueueItem[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save queue to storage
   */
  static saveQueue(queue: OfflinePunchQueueItem[]): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // storage error
    }
  }

  /**
   * Add a punch to the offline queue
   */
  static enqueue(punch: TimePunch): OfflinePunchQueueItem {
    const queue = this.getQueue();
    const item: OfflinePunchQueueItem = {
      id: punch.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workerId: punch.workerId,
      punchType: punch.punchType,
      timestamp: punch.timestamp,
      method: punch.method,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  }

  /**
   * Remove a punch by ID after successful sync
   */
  static dequeue(id: string): void {
    const queue = this.getQueue();
    const updated = queue.filter(item => item.id !== id);
    this.saveQueue(updated);
  }

  /**
   * Clear the entire queue
   */
  static clearQueue(): void {
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Process all queued punches with a sync handler
   */
  static async syncAll(
    handler: (item: OfflinePunchQueueItem) => Promise<boolean>
  ): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;
    const remaining: OfflinePunchQueueItem[] = [];

    for (const item of queue) {
      try {
        const success = await handler(item);
        if (success) {
          syncedCount++;
        } else {
          item.retryCount++;
          remaining.push(item);
          failedCount++;
        }
      } catch {
        item.retryCount++;
        remaining.push(item);
        failedCount++;
      }
    }

    this.saveQueue(remaining);
    return { syncedCount, failedCount };
  }
}

