import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode = 200,
  message = 'Success',
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendCreated = (res: Response, data: unknown): void => {
  sendSuccess(res, data, 201, 'Created successfully');
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
