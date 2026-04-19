<template>
  <!-- RG8 – Modal automatique à la fin de la partie -->
  <NModal :show="show" :mask-closable="false">
    <NCard class="end-modal" :bordered="false">
      <div class="end-modal__content">
        <span class="end-modal__emoji">{{ isWinner ? '🏆' : '💀' }}</span>

        <h2 class="end-modal__title">
          {{ isWinner ? 'Victoire !' : 'Défaite' }}
        </h2>

        <p class="end-modal__subtitle">
          {{
            isWinner
              ? 'Félicitations, vous avez gagné la partie !'
              : 'Vous avez perdu. Bonne chance la prochaine fois !'
          }}
        </p>

        <!-- RG9 – Bouton retour lobby -->
        <NButton
          type="primary"
          color="#4caf82"
          size="large"
          @click="emit('back-to-lobby')"
        >
          Retour au lobby
        </NButton>
      </div>
    </NCard>
  </NModal>
</template>

<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'

defineOptions({ name: 'GameEndModal' })

defineProps<{
  show: boolean
  isWinner: boolean
}>()

const emit = defineEmits<(e: 'back-to-lobby') => void>()
</script>

<style scoped>
.end-modal {
  width: 360px;
  border-radius: 12px;
}

.end-modal__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}

.end-modal__emoji {
  font-size: 3.5rem;
}

.end-modal__title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin: 0;
}

.end-modal__subtitle {
  font-size: 14px;
  color: #777;
  margin: 0;
}
</style>
