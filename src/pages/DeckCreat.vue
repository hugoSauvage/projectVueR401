<script setup lang="ts">
import { NButton, NInput, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useApi } from '@/composables/useApi'
import { ROUTES } from '@/router'
import type { Card } from '@/types'

import CardList from '../components/layout/CardList.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const api = useApi()

const deckId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!deckId.value)

const MAX_CARDS = 10
const deckName = ref('')
const selectedIds = ref<number[]>([])
const cards = ref<Card[]>([])
const loading = ref(false)

async function fetchCards() {
  loading.value = true
  try {
    cards.value = await api.getCards()
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : 'Impossible de charger les cartes.',
    )
  } finally {
    loading.value = false
  }
}

async function fetchExistingDeck() {
  if (!deckId.value) return
  try {
    const deck = await api.getDeck(deckId.value)
    deckName.value = deck.name
    selectedIds.value = deck.cards.map((c) => c.cardId) // RG3 édition
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : 'Impossible de charger le deck.',
    )
  }
}

onMounted(async () => {
  await fetchCards()
  if (deckId.value) await fetchExistingDeck()
})

// RG3 création
const isFormValid = computed(
  () =>
    deckName.value.trim().length > 0 && selectedIds.value.length === MAX_CARDS,
)

async function handleSave() {
  if (!isFormValid.value) return
  const payload = { name: deckName.value.trim(), cards: selectedIds.value }
  try {
    if (isEditMode.value && deckId.value) {
      await api.updateDeck(deckId.value, payload)
      message.success('Deck modifié !')
      router.push(ROUTES.DECK_DETAIL.replace(':id', deckId.value)) // RG4 édition
    } else {
      await api.createDeck(payload)
      message.success('Deck créé !')
      router.push(ROUTES.HOME) // RG4 création
    }
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.',
    )
  }
}
</script>

<template>
  <div class="page">
    <div class="header">
      <button class="back-btn" @click="router.back()">← Retour</button>
      <h1 class="page-title">
        {{ isEditMode ? 'Modifier le deck' : 'Créer un deck' }}
      </h1>
    </div>

    <div class="field">
      <label class="field-label">Nom du deck</label>
      <NInput v-model:value="deckName" placeholder="Mon super deck" />
    </div>

    <!-- RG2 compteur -->
    <p class="card-count">
      <strong :class="{ complete: selectedIds.length === MAX_CARDS }">
        {{ selectedIds.length }}/{{ MAX_CARDS }}
      </strong>
      cartes sélectionnées
      <span v-if="selectedIds.length === MAX_CARDS" class="count-ok"
        >✓ Prêt</span
      >
      <span v-else class="count-hint"
        >— {{ MAX_CARDS - selectedIds.length }} restante(s)</span
      >
    </p>

    <!-- RG3 bouton bloqué -->
    <NButton
      :disabled="!isFormValid"
      color="#4caf82"
      block
      class="create-btn"
      @click="handleSave"
    >
      {{ isEditMode ? 'Sauvegarder les modifications' : 'Créer le deck' }}
    </NButton>

    <div v-if="loading" class="loading">Chargement des cartes…</div>

    <!-- RG1 : CardGrid en mode sélection -->
    <CardList
      v-else
      v-model:selected-ids="selectedIds"
      :cards="cards"
      :max-selection="MAX_CARDS"
      size="md"
    />
  </div>
</template>

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
  color: #111;
}
.field {
  margin-bottom: 12px;
}
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #444;
  margin-bottom: 6px;
}
.card-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
  margin: 12px 0 8px;
}
.card-count strong {
  color: #222;
  transition: color 0.2s;
}
.card-count strong.complete {
  color: #4caf82;
}
.count-ok {
  font-size: 12px;
  color: #4caf82;
  font-weight: 600;
}
.count-hint {
  font-size: 12px;
  color: #aaa;
}
.create-btn {
  margin-bottom: 24px;
}
.loading {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
