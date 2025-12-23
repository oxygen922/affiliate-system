/**
 * 角色权限中间件
 * 老王出品：基于角色的访问控制
 */

const { error: errorResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * 角色授权中间件
 * @param  {...String} allowedRoles - 允许的角色列表
 * @returns {Function} Express中间件
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return errorResponse(res, '未认证用户', 401);
      }

      // 检查用户角色是否在允许列表中
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.email} (角色: ${req.user.role}) 尝试访问需要角色 ${allowedRoles.join(', ')} 的资源`);
        return errorResponse(res, '权限不足', 403);
      }

      logger.info(`用户 ${req.user.email} (角色: ${req.user.role}) 权限验证通过`);
      next();
    } catch (error) {
      logger.error(`权限验证错误：${error.message}`);
      return errorResponse(res, '权限验证失败', 500);
    }
  };
}

/**
 * 仅管理员可访问
 */
function adminOnly(req, res, next) {
  return authorize('admin')(req, res, next);
}

/**
 * 运营人员或管理员可访问
 */
function operatorOrAdmin(req, res, next) {
  return authorize('admin', 'operator')(req, res, next);
}

/**
 * Publisher或管理员可访问
 */
function publisherOrAdmin(req, res, next) {
  return authorize('admin', 'publisher')(req, res, next);
}

/**
 * 广告主或管理员可访问
 */
function advertiserOrAdmin(req, res, next) {
  return authorize('admin', 'advertiser')(req, res, next);
}

module.exports = {
  authorize,
  adminOnly,
  operatorOrAdmin,
  publisherOrAdmin,
  advertiserOrAdmin
};
