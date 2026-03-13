<script lang="ts" setup>
import type { FormRules } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useApi } from '@/composables/useApi'
import { ROUTES } from '@/router'
import { useAuthStore } from '@/store/auth.store'

import type { SignInPayload } from '../types/auth'

const router = useRouter()

const modelRef = ref<SignInPayload>({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: 'Email requis', trigger: ['input', 'blur'] },
  ],
  password: [
    {
      required: true,
      message: 'Mot de passe requis',
      trigger: ['input', 'blur'],
    },
  ],
}

const errorMessage = ref('')
const loading = ref(false)

const authStore = useAuthStore()
const api = useApi()

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const response = await api.signIn(modelRef.value)

    authStore.login(response.token, response.user)

    router.push(ROUTES.HOME)
  } catch {
    errorMessage.value = 'Erreur lors de la connexion'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <NCard title="Connexion" style="max-width: 400px; margin: 40px auto">
    <NForm ref="formRef" :model="modelRef" :rules="rules">
      <NFormItem path="email" label="Email">
        <NInput
          v-model:value="modelRef.email"
          placeholder="votre@email.com"
          @keydown.enter.prevent
        />
      </NFormItem>

      <NFormItem path="password" label="Mot de passe">
        <NInput
          v-model:value="modelRef.password"
          type="password"
          placeholder="********"
          @keydown.enter.prevent
        />
      </NFormItem>

      <div style="display: flex; justify-content: flex-end; margin-top: 12px">
        <NButton type="primary" :loading="loading" round @click="handleSubmit">
          Se connecter
        </NButton>
      </div>

      <NSpace style="margin-top: 12px">
        Pas encore de compte ?
        <RouterLink :to="ROUTES.REGISTER">S'inscrire</RouterLink>
      </NSpace>

      <p v-if="errorMessage" style="color: red">
        {{ errorMessage }}
      </p>
    </NForm>
  </NCard>
</template>
