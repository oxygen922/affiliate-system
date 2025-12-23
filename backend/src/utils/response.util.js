/**
 * 统一响应格式工具
 * 老王出品：标准化API响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 返回数据
 * @param {String} message - 成功消息
 * @param {Number} code - HTTP状态码
 */
function success(res, data = null, message = '操作成功', code = 200) {
  return res.status(code).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 * @param {Number} code - HTTP状态码
 * @param {*} errors - 详细错误信息
 */
function error(res, message = '操作失败', code = 500, errors = null) {
  return res.status(code).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} data - 数据列表
 * @param {Object} pagination - 分页信息
 */
function paginate(res, data, pagination) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  success,
  error,
  paginate
};
