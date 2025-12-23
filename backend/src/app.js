/**
 * Express应用配置
 * 老王出品：Express应用主文件
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger.util');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// 创建Express应用
const app = express();

// 信任代理（如果使用Nginx等反向代理）
app.set('trust proxy', 1);

// CORS配置
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use('/api', require('./routes'));

// 404处理
app.use(notFound);

// 全局错误处理
app.use(errorHandler);

module.exports = app;
