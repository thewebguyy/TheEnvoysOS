import { EventBus } from '../../events/bus';
import { SermonEventType, Envelope } from '../../events/schemas/sermon';
import { ModelRouter } from '../core/model-router';
import { ContextBuilder } from '../core/context-builder';
import { SermonRepository } from '../../domain/sermon/repository';

/**
 * SermonProcessingPipeline
 * Automatically processes sermons when they are recorded.
 */
export class SermonProcessingPipeline {
  private eventBus: EventBus;
  private router: ModelRouter;
  private contextBuilder: ContextBuilder;
  private sermonRepository: SermonRepository;

  constructor(
    eventBus: EventBus, 
    router: ModelRouter, 
    contextBuilder: ContextBuilder,
    sermonRepository: SermonRepository
  ) {
    this.eventBus = eventBus;
    this.router = router;
    this.contextBuilder = contextBuilder;
    this.sermonRepository = sermonRepository;
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
    const { sermonId, mediaId, tenantId } = envelope.payload;
    console.log(`[Pipeline] Processing sermon ${sermonId} (Media: ${mediaId}) for tenant ${tenantId}`);

    // Fetch sermon metadata for context
    const sermon = await this.sermonRepository.findSermonById(sermonId);
    if (!sermon) {
      console.error(`[Pipeline] Sermon ${sermonId} not found in repository`);
      return;
    }

    // Stage 1: Transcription
    // Call external transcription service or local Whisper instance
    const transcript = "Full sermon transcript would be here..."; // Placeholder for stage 1

    // Stage 2: AI Summarization & Tagging with Context
    const summaryTask = `
      Please provide a high-quality summary of the following sermon transcript. 
      The summary should be suitable for the church's communications team to use in newsletters or social media.
      
      TRANSCRIPT:
      ${transcript}
    `;

    const contextualPrompt = await this.contextBuilder.wrapTask(summaryTask, sermon, tenantId);

    console.log(`[Pipeline] Generating automated sermon summary with context for ${tenantId}`);
    
    await this.router.complete(contextualPrompt, {
      provider: 'openai',
      modelId: 'gpt-4o'
    });

    // Stage 3: Emit Processed Event
    this.eventBus.publish({
      id: `proc-${Date.now()}`,
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
