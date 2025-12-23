/**
 * Publisher管理API
 */
import request from '@/utils/request'

export function getPublisherList(params?: any) {
  return request({
    url: '/admin/publishers',
    method: 'GET',
    params
  })
}

export function getPublisherDetail(id: string) {
  return request({
    url: `/admin/publishers/${id}`,
    method: 'GET'
  })
}

export function updatePublisherStatus(id: string, status: string) {
  return request({
    url: `/admin/publishers/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}

export function setPublisherCommissionRate(id: string, rate: number, offerId?: string) {
  return request({
    url: `/admin/publishers/${id}/commission`,
    method: 'PUT',
    data: { rate, offerId }
  })
}
