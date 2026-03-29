const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  prisma,
  User: prisma.user,
  Tenant: prisma.tenant,
  Media: prisma.media,
  Service: prisma.service,
  Segment: prisma.segment,
  Song: prisma.song,
  SystemState: prisma.systemState,
  SystemMeta: prisma.systemMeta,
};
