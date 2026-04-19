import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/store/auth.store'

import ConnexionPage from './pages/ConnexionPage.vue'
import DeckCreat from './pages/DeckCreat.vue'
import DeckDetail from './pages/DeckDetail.vue'
import GamePage from './pages/GamePage.vue'
import HomePage from './pages/HomePage.vue'
import InscriptionPage from './pages/InscriptionPage.vue'

export const ROUTES = {
  HOME: '/',
  CONNEXION: '/login',
  REGISTER: '/register',
  DECK_CREATE: '/decks/create',
  DECK_DETAIL: '/decks/:id',
  DECK_EDIT: '/decks/:id/edit',
  GAME: '/game',
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
  {
    path: ROUTES.DECK_CREATE,
    component: DeckCreat,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.DECK_DETAIL,
    component: DeckDetail,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.DECK_EDIT,
    component: DeckCreat,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.GAME,
    component: GamePage,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next(ROUTES.CONNEXION)
  }

  if (
    !to.meta.requiresAuth &&
    authStore.isAuthenticated &&
    (to.path === ROUTES.CONNEXION || to.path === ROUTES.REGISTER)
  ) {
    return next(ROUTES.HOME)
  }

  next()
})

export default router
