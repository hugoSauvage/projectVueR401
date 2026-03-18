import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/store/auth.store'

import ConnexionPage from './pages/ConnexionPage.vue'
import HomePage from './pages/HomePage.vue'
import InscriptionPage from './pages/InscriptionPage.vue'

export const ROUTES = {
  HOME: '/',
  CONNEXION: '/login',
  REGISTER: '/register',
} as const

const routes = [
  {
    path: ROUTES.HOME,
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.CONNEXION,
    component: ConnexionPage,
    meta: { requiresAuth: false },
  },
  {
    path: ROUTES.REGISTER,
    component: InscriptionPage,
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

//  Protection des routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  //  Pas connecté → accès refusé aux pages protégées
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next(ROUTES.CONNEXION)
  }

  // Déjà connecté → empêche d'aller sur login/register
  if (
    !to.meta.requiresAuth &&
    authStore.isAuthenticated &&
    (to.path === ROUTES.CONNEXION || to.path === ROUTES.REGISTER)
  ) {
    return next(ROUTES.HOME)
  }

  //  Sinon tout passe
  next()
})

export default router
