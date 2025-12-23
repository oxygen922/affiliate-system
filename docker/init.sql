-- 初始化数据库脚本
-- 老王出品：PostgreSQL初始化配置

\c affiliate_platform;

-- 创建UUID扩展（如果不存在）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'UTC';

-- 创建索引（后续通过Sequelize自动创建）
-- 这里只是示例，实际索引由Sequelize在模型中定义

COMMENT ON DATABASE affiliate_platform IS '次级联盟营销平台数据库';
