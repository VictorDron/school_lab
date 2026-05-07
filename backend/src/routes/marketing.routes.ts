import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as MarketingController from '../controllers/marketing.controller.js';

const router = Router();

// Public landing-page lead capture. Rate-limited per IP to slow abuse,
// but generous enough that legitimate retries (network blips) succeed.
const leadCaptureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 20,
  message: { success: false, error: 'Muitas submissões. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/leads', leadCaptureLimiter, MarketingController.createMarketingLead);

export default router;
