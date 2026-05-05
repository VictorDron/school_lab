import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, validateToken, me, logout, createInvite, changePassword, forgotPassword, validateResetToken, resetPassword } from '../controllers/auth.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

// Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: 'Muitas solicitacoes de redefinicao de senha. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/login', loginLimiter, login);
router.post('/register', register);
router.get('/validate-token/:token', validateToken);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.post('/reset-password', resetLimiter, resetPassword);

// Protected routes
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);
router.post('/invite', authenticate, requireRole('ADMIN'), createInvite);

export default router;
