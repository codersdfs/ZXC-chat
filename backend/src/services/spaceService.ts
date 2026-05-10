import { PrismaClient } from '@prisma/client';

// Assuming a Prisma client instance is exported from backend/src/index.ts
import { prisma } from '../index';

/**
 * Creates a new Space record in the database.
 * @param data - Space fields (excluding id, createdAt, updatedAt which are set by Prisma)
 */
export const createSpace = async (data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: string;
  customInstructions?: string;
  defaultModel?: string;
  defaultProvider?: string;
  createdBy: string;
}) => {
  // Prisma will handle defaults for boolean fields (searchSpaceFirst, includeFilesInContext)
  const space = await prisma.space.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      visibility: data.visibility,
      customInstructions: data.customInstructions,
      defaultModel: data.defaultModel,
      defaultProvider: data.defaultProvider,
      createdBy: data.createdBy,
    },
  });
  return space;
};
