import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
});

export const getTasks = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status, priority, search } = req.query;
  let where: any = { userId: user.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  const tasks = await prisma.task.findMany({ where });
  res.json({ tasks });
};

export const createTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = taskSchema.parse(req.body);
  const task = await prisma.task.create({
    data: { ...data, userId: user.id, dueDate: data.dueDate ? new Date(data.dueDate) : null },
  });
  res.status(201).json({ task });
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = taskSchema.partial().parse(req.body);
  const task = await prisma.task.update({
    where: { id: parseInt(id), userId: (req as any).user.id },
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
  });
  res.json({ task });
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.task.delete({
    where: { id: parseInt(id), userId: (req as any).user.id },
  });
  res.status(204).send();
};