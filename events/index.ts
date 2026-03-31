import { EventEmitter } from 'events';
import { Envelope, SermonEventType } from './schemas/sermon';

/**
 * EventBus - The Platform's Backbone
 * This ensures every critical action in the system is emitted as a persistent event.
 */
class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event to the backbone.
   * This is where persistence (to DB for System of Record) will happen.
   */
  public publish<T extends SermonEventType>(envelope: Envelope<T>): void {
    console.log(`[EventBus] ${envelope.type} published from ${envelope.source}`);
    
    // TODO: Persist to DB for "System of Record" requirement
    
    this.emit(envelope.type, envelope.payload);
  }

  /**
   * Subscribe to a specific event type.
   */
  public subscribe<T extends SermonEventType>(
    type: T,
    handler: (payload: Envelope<T>['payload']) => void
  ): void {
    this.on(type, handler);
  }
}

export const eventBus = EventBus.getInstance();
