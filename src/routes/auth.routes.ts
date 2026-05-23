import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register); // Завдання 1[cite: 1]
router.post('/login', login);       // Завдання 2[cite: 1]
router.post('/refresh', refresh);   // Завдання 2[cite: 1]
router.post('/logout', logout);     // Завдання 2[cite: 1]

export default router;