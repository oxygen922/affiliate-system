/**
 * Token工具类
 * 老王出品：JWT Token生成和验证
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-me';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * 生成JWT Token
 * @param {Object} payload - Token载荷数据
 * @param {String} expiresIn - 过期时间
 * @returns {String} JWT Token
 */
function generateToken(payload, expiresIn = JWT_EXPIRE) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证JWT Token
 * @param {String} token - JWT Token
 * @returns {Object} 解码后的Token数据
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
}

/**
 * 解码Token（不验证）
 * @param {String} token - JWT Token
 * @returns {Object} 解码后的Token数据
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * 生成刷新Token
 * @param {Object} payload - Token载荷数据
 * @returns {String} 刷新Token（30天有效期）
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken
};
