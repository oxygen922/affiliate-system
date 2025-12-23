/**
 * 测试服务器启动文件（无需数据库）
 * 老王出品：快速测试代码能否运行
 */

const app = require('./src/app');
const logger = require('./src/utils/logger.util');

const PORT = process.env.PORT || 3000;

/**
 * 启动测试服务器
 */
function startTestServer() {
  try {
    const server = app.listen(PORT, () => {
      logger.info('🚀 测试服务器启动成功！');
      logger.info(`📡 监听端口: ${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💻 健康检查: http://localhost:${PORT}/health`);
      logger.info(`📖 API文档: http://localhost:${PORT}/api`);
      logger.info('');
      logger.info('⚠️  注意：这是测试模式，数据库功能不可用');
      logger.info('⚠️  完整功能需要先启动PostgreSQL数据库');
    });

    // 优雅关闭
    const gracefulShutdown = (signal) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);

      server.close(() => {
        logger.info('HTTP服务器已关闭');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动测试服务器
startTestServer();
