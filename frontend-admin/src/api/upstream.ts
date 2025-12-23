/**
 * 上级联盟API
 */
import request from '@/utils/request'

export function getUpstreamList(params?: any) {
  return request({
    url: '/admin/upstream-affiliates',
    method: 'GET',
    params
  })
}

export function createUpstream(data: any) {
  return request({
    url: '/admin/upstream-affiliates',
    method: 'POST',
    data
  })
}

export function updateUpstream(id: string, data: any) {
  return request({
    url: `/admin/upstream-affiliates/${id}`,
    method: 'PUT',
    data
  })
}

export function deleteUpstream(id: string) {
  return request({
    url: `/admin/upstream-affiliates/${id}`,
    method: 'DELETE'
  })
}

export function getUpstreamStats(id: string) {
  return request({
    url: `/admin/upstream-affiliates/${id}/stats`,
    method: 'GET'
  })
}

export function importMerchants(id: string, merchants: any[]) {
  return request({
    url: `/admin/upstream-affiliates/${id}/import-merchants`,
    method: 'POST',
    data: { merchants }
  })
}
