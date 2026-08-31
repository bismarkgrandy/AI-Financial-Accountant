import prisma from '@/config/database';
import axios from 'axios';
import { AppError } from '@/middleware/errorHandler';
import { env } from '@/config/env';

export const askAi = async (
  businessId: string,
  userId: string,
  role: string,
  message: string,
  conversationId?: string,
) => {
  try {
    const response = await axios.post(
      `${env.AI_SERVICE_URL}/ask`,
      { message, businessId, userId, role, conversationId },
      {
        headers: { 'X-Internal-Service-Key': env.INTERNAL_AI_SERVICE_KEY },
        timeout: env.AI_SERVICE_TIMEOUT_MS,
      },
    );

    return response.data as { conversationId: string; answer: string };
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new AppError('The AI assistant is taking too long to respond. Please try again.', 504);
    }
    throw new AppError('The AI assistant is currently unavailable.', 502);
  }
};

export const listConversations = async (userId: string, businessId: string) => {
  return prisma.conversation.findMany({
    where: { userId, businessId },
    select: {
      id: true, title: true, status: true, createdAt: true, updatedAt: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, role: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

export const getConversation = async (userId: string, businessId: string, conversationId: string) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, businessId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) throw new AppError('Conversation not found', 404);
  return conversation;
};

export const updateConversation = async (
  userId: string,
  businessId: string,
  conversationId: string,
  input: { title?: string; status?: string },
) => {
  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, businessId },
  });
  if (!existing) throw new AppError('Conversation not found', 404);

  return prisma.conversation.update({
    where: { id: conversationId },
    data: input,
  });
};

export const deleteConversation = async (userId: string, businessId: string, conversationId: string) => {
  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, businessId },
  });
  if (!existing) throw new AppError('Conversation not found', 404);

  await prisma.conversation.delete({ where: { id: conversationId } });
};