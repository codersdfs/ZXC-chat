import { Request, Response } from 'express';
import { z } from 'zod';
import { createSpace as createSpaceService } from '../services/spaceService';

// Validation schema for creating a space
const spaceCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  customInstructions: z.string().optional(),
  defaultModel: z.string().optional(),
  defaultProvider: z.string().optional(),
});

/**
 * POST /api/spaces
 * Creates a new space with optional custom instructions.
 */
export const createSpace = async (req: Request, res: Response) => {
  try {
    const data = spaceCreateSchema.parse(req.body);
    // In a real app, you would associate the space with the authenticated user.
    // For simplicity, we set createdBy to a placeholder.
    const createdBy = (req as any).user?.id ?? 'system';
    const space = await createSpaceService({ ...data, createdBy });
    res.status(201).json({ space });
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(400).json({ error: 'Failed to create space' });
  }
};
