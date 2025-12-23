/**
 * 数据库迁移脚本
 * 老王出品：同步所有数据表
 * 老王修复：必须导入models才会创建表！
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger.util');

// ⭐ 关键：必须导入models，Sequelize才会创建表！
const models = require('../src/models');

async function migrate() {
  try {
    logger.info('开始数据库迁移...');

    // 强制同步：删除并重建所有表（开发环境）
    // 生产环境请使用 sync({ force: false, alter: true })
    await sequelize.sync({ force: true, alter: false });

    logger.info('✅ 数据库迁移完成！');
    logger.info('📊 已创建数据表：');

    // 显示所有表名
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.length === 0) {
      logger.warn('⚠️ 没有创建任何表！请检查models导入！');
    } else {
      tables.forEach(table => logger.info(`   - ${table}`));
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
migrate();
