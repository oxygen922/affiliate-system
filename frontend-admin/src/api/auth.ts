/**
 * 认证API
 * 老王出品：用户认证相关接口
 */

import request from '@/utils/request'

/**
 * 用户登录
 */
export function login(data: { email: string; password: string }) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data
  })
}

/**
 * 用户注册
 */
export function register(data: any) {
  return request({
    url: '/auth/register',
    method: 'POST',
    data
  })
}

/**
 * 获取当前用户信息
 */
export function getProfile() {
  return request({
    url: '/auth/profile',
    method: 'GET'
  })
}

/**
 * 用户登出
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}
