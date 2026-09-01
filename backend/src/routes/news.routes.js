import express from 'express';
import { getMarketNews } from '../controllers/news.controller.js';

const router = express.Router();

router.get('/', getMarketNews);

export default router;
