import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateWatchlist
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', getMe);
router.put('/watchlist', updateWatchlist);

export default router;
