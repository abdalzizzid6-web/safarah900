
import express from "express";

export const metrics = {
  totalRequests: 0,
  apiRequests: 0,
  errors: 0,
  startTime: new Date().toISOString()
};

export const monitoringMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  metrics.totalRequests++;
  if (req.path.startsWith('/api')) metrics.apiRequests++;
  
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) metrics.errors++;
  });
  next();
};
