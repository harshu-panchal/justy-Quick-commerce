import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};









