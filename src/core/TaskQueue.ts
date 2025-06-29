export interface QueueItem<T> {
  priority: number;
  item: T;
}

/**
 * Priority-based task queue implementation
 */
export class TaskQueue<T> {
  private queue: QueueItem<T>[] = [];
  private itemSet: Set<T> = new Set();

  /**
   * Add an item to the queue
   */
  public enqueue(item: T & { priority?: number }): void {
    if (this.itemSet.has(item)) {
      return; // Item already in queue
    }

    const priority = item.priority || 0;
    const queueItem: QueueItem<T> = { priority, item };
    
    // Find insertion point to maintain priority order
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, queueItem);
    this.itemSet.add(item);
  }

  /**
   * Remove and return the highest priority item
   */
  public dequeue(): T | null {
    const queueItem = this.queue.shift();
    if (!queueItem) return null;
    
    this.itemSet.delete(queueItem.item);
    return queueItem.item;
  }

  /**
   * Peek at the highest priority item without removing it
   */
  public peek(): T | null {
    return this.queue.length > 0 ? this.queue[0].item : null;
  }

  /**
   * Remove a specific item from the queue
   */
  public remove(item: T): boolean {
    const index = this.queue.findIndex(qi => qi.item === item);
    if (index === -1) return false;
    
    this.queue.splice(index, 1);
    this.itemSet.delete(item);
    return true;
  }

  /**
   * Get all items in priority order
   */
  public getAll(): T[] {
    return this.queue.map(qi => qi.item);
  }

  /**
   * Get items matching a filter
   */
  public filter(predicate: (item: T) => boolean): T[] {
    return this.queue
      .filter(qi => predicate(qi.item))
      .map(qi => qi.item);
  }

  /**
   * Check if queue contains an item
   */
  public contains(item: T): boolean {
    return this.itemSet.has(item);
  }

  /**
   * Get the number of items in the queue
   */
  public get size(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is empty
   */
  public get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all items from the queue
   */
  public clear(): void {
    this.queue = [];
    this.itemSet.clear();
  }

  /**
   * Update the priority of an existing item
   */
  public updatePriority(item: T, newPriority: number): boolean {
    const removed = this.remove(item);
    if (!removed) return false;
    
    (item as any).priority = newPriority;
    this.enqueue(item as T & { priority?: number });
    return true;
  }

  /**
   * Get queue statistics
   */
  public getStats(): {
    total: number;
    byPriority: Map<number, number>;
  } {
    const byPriority = new Map<number, number>();
    
    for (const queueItem of this.queue) {
      const count = byPriority.get(queueItem.priority) || 0;
      byPriority.set(queueItem.priority, count + 1);
    }
    
    return {
      total: this.queue.length,
      byPriority
    };
  }
}