import { Router } from 'express';
import { login, loginRules, register, registerRules } from '../controllers/authController';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/auth/register', registerRules, validate, register);
router.post('/auth/login', loginRules, validate, login);

export default router;
