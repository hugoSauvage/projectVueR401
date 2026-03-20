<template>
  <div class="page-wrapper">
    <div class="content">
      <!-- Section Jouer -->
      <h2 class="section-title">Jouer</h2>

      <div class="play-grid">
        <NCard class="play-card">
          <h3 class="card-title">Créer une partie</h3>
          <NSelect
            v-model:value="selectedDeckId"
            :options="deckOptions"
            placeholder="Sélectionner un deck"
            class="deck-select"
          />
          <NButton
            type="primary"
            color="#4caf82"
            class="create-btn"
            :disabled="!selectedDeckId"
          >
            <!--@click="handleCreateGame" -->
            Créer la partie
          </NButton>
        </NCard>

        <NCard class="play-card">
          <h3 class="card-title">Parties disponibles</h3>
          <div v-if="availableGames.length === 0" class="empty-games">
            <NEmpty description="Aucune partie disponible pour l'instant." />
          </div>
          <!-- <div v-else>
                <div v-for="game in availableGames" :key="game.id" class="game-item">
                {{ game.name }}
                </div>
            </div> -->
        </NCard>
      </div>

      <!-- Section Mes decks -->
      <div class="decks-header">
        <h2 class="section-title">Mes decks</h2>
        <NButton type="primary" color="#4caf82" @click="handleNewDeck">
          + Nouveau deck
        </NButton>
      </div>

      <NSpin v-if="loadingDecks" class="spinner" />

      <template v-else>
        <div v-if="decks.length === 0" class="no-deck">
          Aucun deck — créez-en un !
        </div>
        <NSpace vertical>
          <DeckCard
            v-for="deck in decks"
            :key="deck.id"
            :deck="deck"
            @edit-deck="handleEditDeck"
            @delete-deck="handleDeleteDeck"
          />
        </NSpace>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  NButton,
  NCard,
  NEmpty,
  NSelect,
  NSpace,
  NSpin,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useApi } from '@/composables/useApi'
import type { Deck } from '@/types'

import { ROUTES } from '../../router'
import DeckCard from './DeckCard.vue'

const router = useRouter()
const message = useMessage()
const api = useApi()

// ─── Decks ────────────────────────────────────────────────────────────────────
const decks = ref<Deck[]>([])
const loadingDecks = ref(false)

async function fetchDecks() {
  loadingDecks.value = true
  try {
    decks.value = await api.getMyDecks()
  } catch (e) {
    message.error(
      e instanceof Error ? e.message : 'Impossible de charger vos decks.',
    )
  } finally {
    loadingDecks.value = false
  }
}

onMounted(fetchDecks)

// ─── Jeu ─────────────────────────────────────────────────────────────────────
const selectedDeckId = ref<number | null>(null)
const availableGames = ref([])

const deckOptions = computed(() =>
  decks.value.map((deck) => ({
    label: deck.name,
    value: deck.id,
  })),
)

// function handleCreateGame() {
//   if (!selectedDeckId.value) return
//   console.log('Créer une partie avec le deck:', selectedDeckId.value)
// }

// ─── Navigation ───────────────────────────────────────────────────────────────
function handleNewDeck() {
  router.push(ROUTES.DECK_CREATE)
}

function handleEditDeck(deck: Deck) {
  router.push(ROUTES.DECK_EDIT.replace(':id', String(deck.id)))
}

// ─── Suppression ─────────────────────────────────────────────────────────────
async function handleDeleteDeck(deck: Deck) {
  decks.value = decks.value.filter((d) => d.id !== deck.id)
  try {
    await api.deleteDeck(deck.id)
    message.success('Deck supprimé.')
  } catch (e) {
    decks.value.push(deck) // rollback
    message.error(
      e instanceof Error ? e.message : 'Impossible de supprimer le deck.',
    )
  }
}
</script>

<style scoped>
.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #222;
}
.play-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}
.play-card {
  border-radius: 8px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 14px;
  color: #333;
}
.deck-select {
  margin-bottom: 12px;
}
.create-btn {
  width: auto;
}
.empty-games {
  padding: 24px 0;
  text-align: center;
}
.decks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.decks-header .section-title {
  margin: 0;
}
.no-deck {
  color: #888;
  font-size: 14px;
}
.spinner {
  display: block;
  margin: 40px auto;
}
</style>
