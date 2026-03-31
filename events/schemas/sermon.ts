export enum SermonEventType {
  SERVICE_STARTED = 'ServiceStarted',
  SCENE_CHANGED = 'SceneChanged',
  SERMON_RECORDED = 'SermonRecorded',
  SERMON_PROCESSED = 'SermonProcessed',
  CLIP_READY_FOR_SYNC = 'ClipReadyForSync',
  CONTENT_PUBLISHED = 'ContentPublished',
  GIVING_COMPLETED = 'GivingCompleted'
}

export type SermonEventData = {
  [SermonEventType.SERVICE_STARTED]: {
    serviceId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  };
  [SermonEventType.SCENE_CHANGED]: {
    sceneId: string;
    previousSceneId: string;
    timestamp: Date;
  };
  [SermonEventType.SERMON_RECORDED]: {
    sermonId: string;
    mediaId: string;
    duration: number;
    timestamp: Date;
  };
  [SermonEventType.SERMON_PROCESSED]: {
    sermonId: string;
    stages: string[];
    timestamp: Date;
  };
  [SermonEventType.CLIP_READY_FOR_SYNC]: {
    clipId: string;
    platform: string;
    timestamp: Date;
  };
  [SermonEventType.CONTENT_PUBLISHED]: {
    clipId: string;
    platform: string;
    url: string;
    timestamp: Date;
  };
  [SermonEventType.GIVING_COMPLETED]: {
    transactionId: string;
    amount: number;
    timestamp: Date;
  };
};

export interface Envelope<T extends SermonEventType> {
  type: T;
  payload: SermonEventData[T];
  id: string; // Event ID
  correlationId?: string;
  source: string; // Origin service
}
