/**
 * 服务器入口文件
 * 老王出品：启动HTTP服务器
 */

const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./utils/logger.util');

const PORT = process.env.PORT || 3000;

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 测试数据库连接
    logger.info('正在连接数据库...');
    const connected = await testConnection();

    if (!connected) {
      throw new Error('数据库连接失败');
    }

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功！`);
      logger.info(`📡 监听端口: ${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💻 健康检查: http://localhost:${PORT}/health`);
    });

    // 优雅关闭
    const gracefulShutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);

      server.close(async () => {
        logger.info('HTTP服务器已关闭');

        try {
          await sequelize.close();
          logger.info('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          logger.error('关闭数据库连接失败:', error);
          process.exit(1);
        }
      });

      // 10秒后强制关闭
      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    // 监听退出信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
