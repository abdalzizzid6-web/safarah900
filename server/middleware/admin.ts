
import { z } from "zod";
import { logSecurityAudit } from "./auth";

export const validateBody = (schema: z.ZodTypeAny) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        const event = {
          timestamp: new Date().toISOString(),
          ip: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : String(clientIp),
          path: req.originalUrl || req.path,
          method: req.method,
          userAgent: req.headers['user-agent'] || 'unknown',
          authorized: true,
          type: 'validation_failure',
          reason: `Zod Validation Error: ${issues}`,
          bodySample: JSON.stringify(req.body).substring(0, 200)
        };
        logSecurityAudit(event);
        
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'البيانات المرسلة غير متطابقة مع شروط الفحص الأمني.',
          details: error.issues
        });
      }
      next(error);
    }
  };
};

// Zod Validation Schemas
export const MatchStatsSchema = z.object({
  homeTeam: z.string().min(1, "اسم صاحب الأرض مطلوب"),
  awayTeam: z.string().min(1, "اسم فريق الضيف مطلوب"),
  status: z.string().optional(),
  league: z.string().optional(),
});

export const PredictMatchSchema = z.object({
  homeTeam: z.string().min(1, "اسم الفريق الأول مطلوب"),
  awayTeam: z.string().min(1, "اسم الفريق الثاني مطلوب"),
  league: z.string().optional(),
  status: z.string().optional(),
  homeScore: z.union([z.number(), z.string()]).optional(),
  awayScore: z.union([z.number(), z.string()]).optional(),
});

export const RssFetchSchema = z.object({
  url: z.string().url("رابط مزود RSS غير صالح"),
});

export const RssExtractSchema = z.object({
  html: z.string().min(1, "محتوى HTML لإجراء الاستخراج الإجباري مطلوب"),
  selector: z.string().optional(),
});

export const SendPushSchema = z.object({
  title: z.string().min(1, "عنوان الإشعار مطلوب"),
  body: z.string().min(1, "نص الإشعار مطلوب"),
  topic: z.string().optional(),
  token: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
});
