import { ChurchMemoryStore, ChurchMemorySchema } from '../memory/church-memory';

/**
 * ContextBuilder - AI Infrastructure layer
 * Assembles a prompt with all the necessary historical and identity-based
 * data to ensure the LLM's response is contextually accurate.
 */
export class ContextBuilder {
  private memoryStore: ChurchMemoryStore;

  constructor(memoryStore: ChurchMemoryStore) {
    this.memoryStore = memoryStore;
  }

  /**
   * Build a System Prompt that defines the "Expert Persona" for the AI.
   */
  async buildPersonaContext(tenantId: string): Promise<string> {
    const memory = await this.memoryStore.getMemory(tenantId);
    
    return `
      You are an expert AI Assistant working specifically for "${memory.identity.name}".
      Their mission is: "${memory.identity.mission}".
      Values: ${memory.identity.values.join(', ')}.
      Tone: ${memory.identity.styleGuide.tone}.
      Keywords to favor: ${memory.identity.styleGuide.keywords.join(', ')}.
      Target Audience: ${memory.identity.audience}.
      Pastor's Style: ${memory.pastoralTone}.
      Current Series Context: ${memory.historicalContext}.
    `.trim();
  }

  /**
   * Wraps a raw task (e.g., "Summarize this sermon") in a full context envelope.
   */
  async wrapTask(task: string, sermonMetadata: any, tenantId: string): Promise<string> {
    const persona = await this.buildPersonaContext(tenantId);
    
    return `
      ${persona}

      ---
      TASK:
      ${task}

      ---
      SERMON DATA:
      Title: ${sermonMetadata.title || 'Untitled'}
      Speaker: ${sermonMetadata.speaker || 'Unknown'}
      Date: ${sermonMetadata.date || new Date().toISOString()}
      
      Ensure your response strictly adheres to the style guide and values of "${tenantId}".
    `.trim();
  }
}
