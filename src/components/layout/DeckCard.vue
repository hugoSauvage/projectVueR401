<!-- components/layout/DeckCard.vue -->
<template>
  <NCard class="deck-card">
    <div class="deck-row">
      <span class="deck-name">{{ deck.name }}</span>
      <div class="deck-actions">
        <NButton size="small" type="primary" @click="goToDetail">Voir</NButton>
        <NButton size="small" @click="emit('edit-deck', deck)"
          >Modifier</NButton
        >
        <NButton size="small" type="error" @click="emit('delete-deck', deck)"
          >Supprimer</NButton
        >
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard } from 'naive-ui'
import { useRouter } from 'vue-router'

import { ROUTES } from '@/router'
import type { Deck } from '@/types'

const props = defineProps<{ deck: Deck }>()
const emit = defineEmits<(e: 'edit-deck' | 'delete-deck', deck: Deck) => void>()

const router = useRouter()

function goToDetail() {
  router.push(ROUTES.DECK_DETAIL.replace(':id', String(props.deck.id)))
}
</script>
