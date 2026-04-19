<template>
  <div class="page">
    <div class="header">
      <button class="back-btn" @click="router.back()">← Retour</button>
      <h1 class="page-title">{{ deck?.name ?? '…' }}</h1>
      <!-- RG2 : bouton vers l'édition -->
      <NButton color="#4caf82" @click="goToEdit">Modifier le deck</NButton>
    </div>

    <div v-if="loading" class="loading">Chargement…</div>

    <template v-else-if="deck">
      <p class="subtitle">{{ deck.cards.length }} cartes</p>
      <!-- RG1 : lecture seule, pas de sélection -->
      <CardGrid :cards="resolvedCards" :selected-ids="[]" size="md" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { NButton, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CardGrid from '@/components/layout/CardList.vue'
import { useApi } from '@/composables/useApi'
import { ROUTES } from '@/router'
import type { Card, Deck } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const api = useApi()

const deckId = computed(() => route.params.id as string)
const deck = ref<Deck | null>(null)
const allCards = ref<Card[]>([])
const loading = ref(false)

// Résout les Card[] à partir des DeckCard[] du deck
const resolvedCards = computed(() => {
  if (!deck.value) return []
  return deck.value.cards
    .map((dc) => allCards.value.find((c) => c.id === dc.cardId))
    .filter((c): c is Card => !!c)
})

async function fetchDetail() {
  loading.value = true
  try {
    const [fetchedDeck, fetchedCards] = await Promise.all([
      api.getDeck(deckId.value),
      api.getCards(),
    ])
    deck.value = fetchedDeck
    allCards.value = fetchedCards
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : 'Impossible de charger le deck.',
    )
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)

function goToEdit() {
  router.push(ROUTES.DECK_EDIT.replace(':id', deckId.value))
}
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #555;
  cursor: pointer;
}
.back-btn:hover {
  color: #222;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  flex: 1;
}
.subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 16px;
}
.loading {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
