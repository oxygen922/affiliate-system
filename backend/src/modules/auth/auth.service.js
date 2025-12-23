/**
 * Auth Service - 认证业务逻辑层
 * 老王出品：用户认证核心业务
 */

const { User, Publisher } = require('../../models');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../../utils/token.util');
const logger = require('../../utils/logger.util');

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户注册
   */
  async register(data) {
    try {
      const { email, password, role, ...profileData } = data;

      // 检查邮箱是否已存在
      const existingUser = await User.findOne({
        where: { email }
      });

      if (existingUser) {
        throw new Error('邮箱已被注册');
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await User.create({
        email,
        password: hashedPassword,
        role: role || 'publisher',
        status: 'active'
      });

      // 如果是Publisher，创建Publisher档案
      let publisher = null;
      if (user.role === 'publisher') {
        publisher = await Publisher.create({
          userId: user.id,
          name: profileData.name || email.split('@')[0],
          defaultCommissionRate: 80.00
        });
      }

      logger.info(`用户注册成功: ${user.id}, Role: ${user.role}`);

      return {
        user,
        publisher,
        token: generateToken({ id: user.id, email: user.email, role: user.role }),
        refreshToken: generateRefreshToken({ id: user.id })
      };
    } catch (error) {
      logger.error('用户注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(email, password) {
    try {
      // 查找用户
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        throw new Error('邮箱或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new Error('账号已被禁用');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('邮箱或密码错误');
      }

      // 更新最后登录时间
      await user.update({
        lastLoginAt: new Date()
      });

      // 获取Publisher信息（如果是Publisher）
      let publisher = null;
      if (user.role === 'publisher') {
        publisher = await Publisher.findOne({
          where: { userId: user.id }
        });
      }

      logger.info(`用户登录成功: ${user.id}, Role: ${user.role}`);

      return {
        user,
        publisher,
        token: generateToken({ id: user.id, email: user.email, role: user.role }),
        refreshToken: generateRefreshToken({ id: user.id })
      };
    } catch (error) {
      logger.error('用户登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果是Publisher，加载Publisher信息
    let publisher = null;
    if (user.role === 'publisher') {
      publisher = await Publisher.findOne({
        where: { userId: user.id }
      });
    }

    return {
      user,
      publisher
    };
  }
}

module.exports = new AuthService();
