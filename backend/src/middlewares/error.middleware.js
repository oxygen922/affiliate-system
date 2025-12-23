/**
 * 错误处理中间件
 * 老王出品：统一错误处理
 */

const logger = require('../utils/logger.util');
const { error: errorResponse } = require('../utils/response.util');

/**
 * 全局错误处理中间件
 * 必须在所有路由之后注册
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error(`错误：${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return errorResponse(res, '数据验证失败', 400, errors);
  }

  // Sequelize唯一性约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || '字段';
    return errorResponse(res, `${field} 已存在`, 409);
  }

  // Sequelize外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, '关联数据不存在', 400);
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token无效', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token已过期', 401);
  }

  // 自定义业务错误
  if (err.name === 'BusinessError') {
    return errorResponse(res, err.message, err.statusCode || 400);
  }

  // 默认服务器错误
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    500,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
}

/**
 * 404错误处理
 */
function notFound(req, res) {
  return errorResponse(res, `路由 ${req.url} 不存在`, 404);
}

/**
 * 异步路由包装器
 * 自动捕获async函数中的错误
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
