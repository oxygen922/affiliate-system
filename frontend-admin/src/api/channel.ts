/**
 * 渠道API
 */
import request from '@/utils/request'

export function getChannelList(params?: any) {
  return request({
    url: '/admin/channels',
    method: 'GET',
    params
  })
}

export function getChannelDetail(id: string) {
  return request({
    url: `/admin/channels/${id}`,
    method: 'GET'
  })
}

export function updateChannelStatus(id: string, status: string) {
  return request({
    url: `/admin/channels/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}
