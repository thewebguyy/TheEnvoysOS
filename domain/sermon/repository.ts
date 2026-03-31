import { PrismaClient } from '@prisma/client';
import { SermonEventType, Envelope } from '../../events/schemas/sermon';
import { EventBus } from '../../events/bus';
import { v4 as uuidv4 } from 'uuid';

export class SermonRepository {
  private prisma: PrismaClient;
  private eventBus: EventBus;

  constructor(prismaClient: PrismaClient, eventBus: EventBus) {
    this.prisma = prismaClient;
    this.eventBus = eventBus;
  }

  /**
   * Helper to wrap and publish domain events
   */
  private publishEvent<T extends SermonEventType>(type: T, payload: any) {
    const envelope: Envelope<T> = {
      id: uuidv4(),
      type,
      payload,
      source: 'SermonRepository',
      correlationId: payload.sermonId || payload.serviceId || undefined
    };
    this.eventBus.publish(envelope);
  }

  async findAllSermons() {
    return this.prisma.sermon.findMany({
      include: { media: true, _count: { select: { segments: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findSermonById(id: string) {
    return this.prisma.sermon.findUnique({
      where: { id },
      include: { 
        media: true, 
        segments: { 
          include: { clips: true },
          orderBy: { startTime: 'asc' } 
        } 
      }
    });
  }

  async createSermon(data: { title: string; speaker: string; serviceId: string; mediaId?: string; tenantId: string }) {
    const sermon = await this.prisma.sermon.create({
      data
    });

    // Emit event for systemic record
    this.publishEvent(SermonEventType.SERMON_RECORDED, {
      sermonId: sermon.id,
      mediaId: sermon.mediaId || 'unknown',
      tenantId: sermon.tenantId,
      duration: 0, // Metadata would fill this in later
      timestamp: new Date()
    });

    return sermon;
  }

  async createSegment(data: { sermonId: string; title: string; startTime: number; endTime: number; type?: string }) {
    const segment = await this.prisma.sermonSegment.create({
      data: {
        sermonId: data.sermonId,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || 'CLIP'
      }
    });

    // Potential event: SegmentMarkersUpdated
    return segment;
  }

  async updateSegment(id: string, data: any) {
    return this.prisma.sermonSegment.update({
      where: { id },
      data
    });
  }

  async deleteSegment(id: string) {
    return this.prisma.sermonSegment.delete({ where: { id } });
  }

  async findAllClips() {
    return this.prisma.clip.findMany({
      include: { sermon: true, segment: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findClipsBySermonId(sermonId: string) {
    return this.prisma.clip.findMany({
      where: { sermonId },
      include: { segment: true }
    });
  }

  async findClipById(id: string) {
    return this.prisma.clip.findUnique({
      where: { id },
      include: { sermon: true, segment: true }
    });
  }

  async createClipFromSegment(segmentId: string, data: { title?: string; caption?: string; platform?: string }) {
    const segment = await this.prisma.sermonSegment.findUnique({
      where: { id: segmentId }
    });
    if (!segment) throw new Error('Segment not found');

    const clip = await this.prisma.clip.create({
      data: {
        segmentId,
        sermonId: segment.sermonId,
        title: data.title || segment.title,
        caption: data.caption || '',
        platform: data.platform || 'YOUTUBE',
        status: 'DRAFT'
      }
    });

    this.publishEvent(SermonEventType.CLIP_READY_FOR_SYNC, {
      clipId: clip.id,
      platform: clip.platform || 'YOUTUBE',
      timestamp: new Date()
    });

    return clip;
  }

  async updateClip(id: string, data: any) {
    return this.prisma.clip.update({
      where: { id },
      data
    });
  }

  async deleteClip(id: string) {
    return this.prisma.clip.delete({ where: { id } });
  }

  async getClipStatus(id: string) {
    return this.prisma.clip.findUnique({
      where: { id },
      select: { 
        status: true, 
        exportUrl: true, 
        error: true, 
        exportedAt: true,
        syncJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  async createSyncJob(clipId: string) {
    return this.prisma.syncJob.create({
      data: {
        clipId,
        status: 'PENDING'
      }
    });
  }

  async findSyncJobById(id: string) {
    return this.prisma.syncJob.findUnique({
      where: { id },
      include: { clip: true }
    });
  }

  async updateSyncJob(id: string, data: any) {
    return this.prisma.syncJob.update({
      where: { id },
      data
    });
  }

  async findPendingSyncJobs(limit: number = 5) {
    return this.prisma.syncJob.findMany({
      where: { status: 'PENDING' },
      take: limit
    });
  }

  async updateSyncProgress(jobId: string, clipId: string, status: 'PROCESSING' | 'DONE' | 'FAILED', error?: string, url?: string) {
    const jobUpdate = { status, error: error || null };
    const clipUpdate: any = { status: status === 'DONE' ? 'EXPORTED' : status, error: error || null };
    
    if (status === 'DONE' && url) {
      clipUpdate.exportUrl = url;
      clipUpdate.exportedAt = new Date();
    }

    const [job, clip] = await this.prisma.$transaction([
      this.prisma.syncJob.update({ where: { id: jobId }, data: jobUpdate }),
      this.prisma.clip.update({ where: { id: clipId }, data: clipUpdate })
    ]);

    if (status === 'DONE') {
      this.publishEvent(SermonEventType.CONTENT_PUBLISHED, {
        clipId: clip.id,
        platform: clip.platform || 'YOUTUBE',
        url: clip.exportUrl || '',
        timestamp: new Date()
      });
    }

    return [job, clip];
  }
}
