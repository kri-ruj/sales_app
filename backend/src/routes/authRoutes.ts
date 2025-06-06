import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  redirectToLineAuth,
  handleLineCallback,
  validatePassword,
  setupMFA,
  verifyMFASetup,
  verifyMFA,
  disableMFA,
  regenerateBackupCodes,
  getMFAStatus,
} from '../controllers/authController';
import { protect, authorize } from '../middleware/authMiddleware';
import { registrationRules, loginRules } from '../utils/validationRules';

const router = express.Router();

router.post('/register', registrationRules, registerUser);
router.post('/login', loginRules, loginUser);
router.get('/me', protect, getMe);

// Password validation endpoint for real-time feedback
router.post('/validate-password', validatePassword);

// MFA Routes
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/verify-setup', protect, verifyMFASetup);
router.post('/mfa/verify', verifyMFA); // Public - used during login flow
router.post('/mfa/disable', protect, disableMFA);
router.post('/mfa/regenerate-codes', protect, regenerateBackupCodes);
router.get('/mfa/status', protect, getMFAStatus);

// LINE Login Auth
router.get('/line', redirectToLineAuth);
router.get('/line/callback', handleLineCallback);

// Example of a protected route for admin only
router.get('/admin-test', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Welcome Admin!', user: (req as any).user });
});

// Example of a protected route for sales or manager
router.get('/sales-manager-test', protect, authorize('sales', 'manager'), (req, res) => {
  res.json({ message: 'Welcome Sales or Manager!', user: (req as any).user });
});

export default router;