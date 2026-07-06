
import rateLimit from "express-rate-limit";
import { logSecurityAudit } from "./auth";

export const authAbuseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: "Too Many Requests",
    message: "تم رصد نشاط فائق السرعة! يرجى تخفيف حمولة الطلبات لحماية موارد النظام.",
    message_en: "Too many requests. Please slow down to maintain stable access."
  },
  handler: (req: any, res: any, next: any, options: any) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const abuseEvent = {
      timestamp: new Date().toISOString(),
      ip: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : String(clientIp),
      path: req.originalUrl || req.path,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'unknown',
      authorized: false,
      type: 'api_abuse',
      reason: `Abuse prevention rate limit hit (IP blocked for 15 mins)`
    };
    logSecurityAudit(abuseEvent);
    res.status(429).json(options.message);
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
