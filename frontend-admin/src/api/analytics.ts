/**
 * 数据统计API
 */
import request from '@/utils/request'

export function getDashboardStats() {
  return request({
    url: '/admin/analytics/dashboard',
    method: 'GET'
  })
}

export function getTopChannels(limit: number = 10) {
  return request({
    url: '/admin/analytics/top-channels',
    method: 'GET',
    params: { limit }
  })
}

export function getTopOffers(limit: number = 10) {
  return request({
    url: '/admin/analytics/top-offers',
    method: 'GET',
    params: { limit }
  })
}
