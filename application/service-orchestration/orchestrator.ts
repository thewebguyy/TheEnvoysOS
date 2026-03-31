import { ServiceRepository } from '../../domain/service';
import { SermonEventType, Envelope } from '../../events/schemas/sermon';
import { EventBus } from '../../events/bus';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceOrchestrationConfig {
  serviceRepository: ServiceRepository;
  eventBus: EventBus;
}

/**
 * Service Orchestration Application Service
 * Coordinates service lifecycles across the platform.
 */
export class ServiceOrchestration {
  private serviceRepo: ServiceRepository;
  private eventBus: EventBus;

  constructor(config: ServiceOrchestrationConfig) {
    this.serviceRepo = config.serviceRepository;
    this.eventBus = config.eventBus;
  }

  private publishEvent<T extends SermonEventType>(type: T, payload: any) {
    const envelope: Envelope<T> = {
      id: uuidv4(),
      type,
      payload,
      source: 'ServiceOrchestration',
      correlationId: payload.serviceId
    };
    this.eventBus.publish(envelope);
  }

  /**
   * Starts a new service session.
   */
  async startService(name: string, tenantId: string = 'default') {
    const service = await this.serviceRepo.createService({
      name: name || `Sunday Service ${new Date().toLocaleDateString()}`,
      date: new Date(),
      status: 'LIVE',
      tenantId
    });

    // Orchestrate downstream side-effects (event-driven)
    this.publishEvent(SermonEventType.SERVICE_STARTED, {
      serviceId: service.id,
      timestamp: new Date()
    });

    return service;
  }

  /**
   * Updates the status of an existing service.
   */
  async updateServiceStatus(id: string, status: string) {
    const service = await this.serviceRepo.updateService(id, { status });
    
    // If scene changed logic was here, we'd emit SCENE_CHANGED
    return service;
  }

  /**
   * Retrieves all services.
   */
  async listAllServices() {
    return this.serviceRepo.findAllServices();
  }

  /**
   * Finds a specific service by ID.
   */
  async getService(id: string) {
    return this.serviceRepo.findServiceById(id);
  }
}
