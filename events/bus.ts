import { EventEmitter } from 'events';
import { SermonEventType, Envelope } from './schemas/sermon';

/**
 * EventBus - System Backbone
 * Ensures all domain events are captured and distributable.
 */
export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish a domain event.
   */
  public publish<T extends SermonEventType>(envelope: Envelope<T>): void {
    console.log(`[EventBus] Publishing ${envelope.type}`, envelope.id);
    this.emitter.emit(envelope.type, envelope);
    this.emitter.emit('*', envelope); // Global watcher
  }

  /**
   * Subscribe to a domain event.
   */
  public subscribe<T extends SermonEventType>(
    type: T | '*',
    handler: (envelope: Envelope<any>) => void
  ): void {
    this.emitter.on(type, handler);
  }

  /**
   * Unsubscribe from a domain event.
   */
  public unsubscribe<T extends SermonEventType>(
    type: T | '*',
    handler: (envelope: Envelope<any>) => void
  ): void {
    this.emitter.removeListener(type, handler);
  }
}

export const eventBus = EventBus.getInstance();
