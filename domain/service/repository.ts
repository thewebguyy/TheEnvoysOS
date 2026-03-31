import { PrismaClient } from '@prisma/client';

export interface CreateServiceInput {
  name: string;
  date?: Date;
  status: 'LIVE' | 'ENDED' | 'DRAFT';
  tenantId: string;
}

export class ServiceRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findServiceById(id: string) {
    return this.prisma.service.findUnique({
      where: { id }
    });
  }

  async findAllServices() {
    return this.prisma.service.findMany({
      orderBy: { date: 'desc' }
    });
  }

  async createService(input: any) {
    return this.prisma.service.create({
      data: {
        name: input.name,
        date: input.date || new Date(),
        status: input.status || 'DRAFT',
        tenantId: input.tenantId
      }
    });
  }

  async updateService(id: string, data: any) {
    return this.prisma.service.update({
      where: { id },
      data
    });
  }

  async deleteService(id: string) {
    return this.prisma.service.delete({
      where: { id }
    });
  }
}
