import { createRouter, createWebHistory } from 'vue-router'

import ConnexionPage from './pages/ConnexionPage.vue'
import HomePage from './pages/HomePage.vue'
import InscriptionPage from './pages/InscriptionPage.vue'

export const ROUTES = {
  HOME: '/',
  CONNEXION: '/login',
  REGISTER: '/register',
} as const

const routes = [
  { path: ROUTES.HOME, component: HomePage, meta: { requiresAuth: true } },
  {
    path: ROUTES.CONNEXION,
    component: ConnexionPage,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.REGISTER,
    component: InscriptionPage,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
