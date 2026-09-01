import express from 'express';
import {
  getQuote,
  getHistoricalData,
  searchStocks
} from '../controllers/stock.controller.js';

const router = express.Router();

router.get('/quote/:symbol', getQuote);
router.get('/history/:symbol', getHistoricalData);
router.get('/search', searchStocks);

export default router;
