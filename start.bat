@echo off
echo ===================================================
echo   Starting TradeNest Pro Market Terminal + Backend
echo ===================================================

echo Starting Yahoo Finance Backend on port 5000...
start /b node backend/server.js

echo Opening TradeNest Frontend...
start http://localhost:5173

npm run dev
