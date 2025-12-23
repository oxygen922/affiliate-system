/**
 * Vue Router配置
 * 老王出品：路由配置文件
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/Layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'upstream-affiliates',
        name: 'UpstreamAffiliates',
        component: () => import('@/views/UpstreamAffiliates/index.vue'),
        meta: { title: '上级联盟', icon: 'Link' }
      },
      {
        path: 'channels',
        name: 'Channels',
        component: () => import('@/views/Channels/index.vue'),
        meta: { title: '渠道管理', icon: 'Menu' }
      },
      {
        path: 'offers',
        name: 'Offers',
        component: () => import('@/views/Offers/index.vue'),
        meta: { title: 'Offer管理', icon: 'Goods' }
      },
      {
        path: 'publishers',
        name: 'Publishers',
        component: () => import('@/views/Publishers/index.vue'),
        meta: { title: 'Publisher管理', icon: 'User' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
