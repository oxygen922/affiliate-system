/**
 * JWT认证中间件
 * 老王出品：用户身份验证
 */

const { verifyToken } = require('../utils/token.util');
const { error: errorResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * 认证中间件
 * 验证JWT Token，解析用户信息
 */
function authenticate(req, res, next) {
  try {
    // 从请求头获取Token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, '未提供认证Token', 401);
    }

    // 提取Token
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证Token
    const decoded = verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    logger.info(`用户 ${req.user.email} 认证成功`);
    next();
  } catch (error) {
    logger.error(`认证失败：${error.message}`);
    return errorResponse(res, 'Token无效或已过期', 401);
  }
}

/**
 * 可选认证中间件
 * 如果提供了Token则验证，没有Token也可以继续（用于游客访问）
 */
function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    // Token无效，但不阻止请求继续
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
