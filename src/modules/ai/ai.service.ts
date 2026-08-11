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