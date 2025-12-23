/**
 * Offer API
 */
import request from '@/utils/request'

export function getOfferList(params?: any) {
  return request({
    url: '/admin/offers',
    method: 'GET',
    params
  })
}

export function createOffer(data: any) {
  return request({
    url: '/admin/offers',
    method: 'POST',
    data
  })
}

export function updateOffer(id: string, data: any) {
  return request({
    url: `/admin/offers/${id}`,
    method: 'PUT',
    data
  })
}

export function deleteOffer(id: string) {
  return request({
    url: `/admin/offers/${id}`,
    method: 'DELETE'
  })
}

export function approveOffer(id: string, status: string, reason?: string) {
  return request({
    url: `/admin/offers/${id}/approve`,
    method: 'POST',
    data: { status, reason }
  })
}
