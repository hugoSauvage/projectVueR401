import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useStorage } from '@/composables/useStorage'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const storage = useStorage()

  const token = ref<string | null>(storage.get('token'))
  const user = ref<User | null>(storage.get('user'))

  const isAuthenticated = computed(() => token.value !== null)

  function login(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser

    storage.set('token', newToken)
    storage.set('user', newUser)
  }

  function logout() {
    token.value = null
    user.value = null

    storage.remove('token')
    storage.remove('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  }
})
