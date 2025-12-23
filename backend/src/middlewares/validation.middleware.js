/**
 * 数据验证中间件
 * 老王出品：使用Joi验证请求数据
 */

const Joi = require('joi');
const { error: errorResponse } = require('../utils/response.util');

/**
 * 验证中间件生成器
 * @param {Object} schema - Joi验证schema
 * @param {String} property - 验证属性（body/query/params）
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return errorResponse(res, '数据验证失败', 400, errors);
    }

    req[property] = value;
    next();
  };
}

// Channel验证schema
const channelSchemas = {
  // 创建Channel
  create: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': '渠道名称至少2个字符',
      'string.max': '渠道名称最多100个字符',
      'any.required': '渠道名称不能为空'
    }),
    description: Joi.string().max(500).allow('', null),
    website: Joi.string().uri().allow('', null).messages({
      'string.uri': '网站URL格式不正确'
    }),
    trafficType: Joi.string().valid('website', 'social', 'email', 'ppc', 'mobile', 'other').required(),
    defaultCommissionRate: Joi.number().min(0).max(100).precision(2).default(80.00).messages({
      'number.min': '佣金比例不能小于0',
      'number.max': '佣金比例不能大于100'
    })
  }),

  // 更新Channel
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500).allow('', null),
    website: Joi.string().uri().allow('', null),
    trafficType: Joi.string().valid('website', 'social', 'email', 'ppc', 'mobile', 'other'),
    defaultCommissionRate: Joi.number().min(0).max(100).precision(2),
    status: Joi.string().valid('active', 'inactive', 'suspended')
  }),

  // 查询Channel列表
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    trafficType: Joi.string().valid('website', 'social', 'email', 'ppc', 'mobile', 'other'),
    search: Joi.string().max(100)
  })
};

// ChannelOffer验证schema
const channelOfferSchemas = {
  // 申请Offer
  create: Joi.object({
    offerId: Joi.string().uuid().required().messages({
      'string.guid': 'Offer ID格式不正确',
      'any.required': 'Offer ID不能为空'
    }),
    commissionRate: Joi.number().min(0).max(100).precision(2).messages({
      'number.min': '佣金比例不能小于0',
      'number.max': '佣金比例不能大于100'
    }),
    notes: Joi.string().max(500).allow('', null)
  }),

  // 审核ChannelOffer
  approve: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    rejectionReason: Joi.string().when('status', {
      is: 'rejected',
      then: Joi.string().required().messages({
        'any.required': '拒绝时必须填写拒绝理由'
      })
    }).allow('', null)
  })
};

// UpstreamAffiliate验证schema
const upstreamAffiliateSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).pattern(/^[a-z0-9_-]+$/i).required().messages({
      'string.pattern.base': '联盟代码只能包含字母、数字、下划线和横线'
    }),
    website: Joi.string().uri().allow('', null),
    description: Joi.string().max(1000).allow('', null),
    logo: Joi.string().uri().allow('', null),
    commissionRate: Joi.number().min(0).max(100).precision(2).default(0.00)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    website: Joi.string().uri().allow('', null),
    description: Joi.string().max(1000).allow('', null),
    logo: Joi.string().uri().allow('', null),
    commissionRate: Joi.number().min(0).max(100).precision(2),
    status: Joi.string().valid('active', 'inactive'),
    apiConfig: Joi.object()
  })
};

// PaymentAccount验证schema
const paymentAccountSchemas = {
  create: Joi.object({
    accountType: Joi.string().valid('bank', 'paypal', 'wechat', 'alipay', 'stripe').required(),
    accountName: Joi.string().min(2).max(100).required(),
    accountNumber: Joi.string().min(2).max(255).required(),
    bankInfo: Joi.object().allow(null),
    currency: Joi.string().length(3).default('USD'),
    isDefault: Joi.boolean().default(false)
  }),

  update: Joi.object({
    accountName: Joi.string().min(2).max(100),
    accountNumber: Joi.string().min(2).max(255),
    bankInfo: Joi.object().allow(null),
    isDefault: Joi.boolean(),
    status: Joi.string().valid('active', 'inactive')
  })
};

module.exports = {
  validate,
  channelSchemas,
  channelOfferSchemas,
  upstreamAffiliateSchemas,
  paymentAccountSchemas
};
