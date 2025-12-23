/**
 * Auth Controller - 认证控制器
 * 老王出品：用户认证API
 */

const authService = require('./auth.service');
const { success, error: errorResponse } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 认证控制器
 */
class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const data = req.body;

    const result = await authService.register(data);

    logger.info(`新用户注册: ${result.user.email}`);
    return success(res, result, '注册成功', 201);
  });

  /**
   * 用户登录
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, '邮箱和密码不能为空', 400);
    }

    const result = await authService.login(email, password);

    logger.info(`用户登录: ${email}`);
    return success(res, result, '登录成功');
  });

  /**
   * 获取当前用户信息
   * GET /api/auth/profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await authService.getProfile(userId);

    return success(res, result);
  });

  /**
   * 用户登出
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    logger.info(`用户登出: ${req.user.id}`);

    // TODO: 实现Token黑名单（如果有Redis）

    return success(res, null, '登出成功');
  });
}

module.exports = new AuthController();
