<script lang="ts" setup>
import type { FormRules } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'

import { useApi } from '@/composables/useApi'
import { ROUTES } from '@/router'

import { useAuthStore } from '../store/auth.store'
import type { SignUpPayload } from '../types/auth'

const router = useRouter()
const authStore = useAuthStore()
const api = useApi()

const modelRef = ref<SignUpPayload>({
  email: '',
  password: '',
  username: '',
})

const rules: FormRules = {
  username: [
    {
      required: true,
      message: "Nom d'utilisateur requis",
      trigger: ['input', 'blur'],
    },
  ],
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

const loading = ref(false)
const errorMessage = ref('')

//RG2, RG3, RG4

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    // Appel API réel
    const response = await api.signUp(modelRef.value)

    authStore.login(response.token, response.user) //RG4

    router.push(ROUTES.HOME)
  } catch {
    errorMessage.value = 'Erreur lors de l inscription' // RG3
  } finally {
    loading.value = false // RG2
  }
}
</script>

<template>
  <NCard title="Inscription" style="max-width: 400px; margin: 40px auto">
    <NForm ref="formRef" :model="modelRef" :rules="rules">
      <NFormItem path="username" label="Nom d'utilisateur">
        <NInput
          v-model:value="modelRef.username"
          type="text"
          placeholder="Nom d'utilisateur"
          @keydown.enter.prevent
        />
      </NFormItem>

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
        <NButton type="primary" round @click="handleSubmit">
          S'inscrire
        </NButton>
      </div>

      <NSpace style="margin-top: 12px">
        Déjà un compte ?
        <RouterLink :to="ROUTES.CONNEXION">Se connecter</RouterLink>
      </NSpace>
    </NForm>
  </NCard>
</template>
