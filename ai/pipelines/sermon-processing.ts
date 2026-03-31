import { EventBus } from '../../events/bus';
import { SermonEventType, Envelope } from '../../events/schemas/sermon';
import { ModelRouter } from '../core/model-router';

/**
 * SermonProcessingPipeline
 * Automatically processes sermons when they are recorded.
 */
export class SermonProcessingPipeline {
  private eventBus: EventBus;
  private router: ModelRouter;

  constructor(eventBus: EventBus, router: ModelRouter) {
    this.eventBus = eventBus;
    this.router = router;
    this.initialize();
  }

  private initialize() {
    console.log('[Pipeline] Initializing SermonProcessingPipeline');
    this.eventBus.subscribe(SermonEventType.SERMON_RECORDED, this.onSermonRecorded.bind(this));
  }

  /**
   * Automatic handoff when a sermon is recorded.
   */
  private async onSermonRecorded(envelope: Envelope<SermonEventType.SERMON_RECORDED>) {
    const { sermonId, mediaId } = envelope.payload;
    console.log(`[Pipeline] Processing sermon ${sermonId} (Media: ${mediaId})`);

    // Stage 1: Transcription
    // Call external transcription service or local Whisper instance

    // Stage 2: AI Summarization & Tagging
    await this.router.complete(`Summarize sermon with ID ${sermonId}`, {
      provider: 'openai',
      modelId: 'gpt-4o'
    });

    // Stage 3: Emit Processed Event
    this.eventBus.publish({
      id: 'internal-id',
      type: SermonEventType.SERMON_PROCESSED,
      payload: {
        sermonId,
        stages: ['Transcription', 'Summarization', 'Tagging'],
        timestamp: new Date()
      },
      source: 'SermonProcessingPipeline'
    });
  }
}
