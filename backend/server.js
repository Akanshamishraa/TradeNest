import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import stockRoutes from './src/routes/stock.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import newsRoutes from './src/routes/news.routes.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TradeNest Financial Backend API is running with Auth & News'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/stocks', stockRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TradeNest Backend running on http://localhost:${PORT}`);
});
