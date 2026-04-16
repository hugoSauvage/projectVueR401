<template>
  <div class="page-wrapper">
    <div class="content">
      <!-- Section Jouer -->
      <h2 class="section-title">Jouer</h2>

      <div class="play-grid">
        <!-- ── Créer une partie ── -->
        <NCard class="play-card">
          <h3 class="card-title">Créer une partie</h3>

          <NSelect
            v-model:value="selectedDeckId"
            :options="deckOptions"
            placeholder="Sélectionner un deck"
            class="deck-select"
            :disabled="!isConnected || !!currentRoom"
          />

          <template v-if="currentRoom">
            <!-- En attente d'un adversaire -->
            <div class="waiting-box">
              <NSpin size="small" />
              <span class="waiting-text">En attente d'un adversaire…</span>
            </div>
            <NButton type="default" class="create-btn" @click="handleLeaveRoom">
              Annuler
            </NButton>
          </template>

          <template v-else>
            <NButton
              type="primary"
              color="#4caf82"
              class="create-btn"
              :disabled="!selectedDeckId || !isConnected"
              :loading="isLoading"
              @click="handleCreateRoom"
            >
              Créer la partie
            </NButton>
          </template>

          <!-- Statut connexion socket -->
          <div class="socket-status" :class="{ connected: isConnected }">
            <span class="socket-dot" />
            {{ isConnected ? 'Connecté' : 'Connexion…' }}
          </div>
        </NCard>

        <!-- ── Parties disponibles ── -->
        <NCard class="play-card">
          <h3 class="card-title">Parties disponibles</h3>

          <div v-if="waitingRooms.length === 0" class="empty-games">
            <NEmpty description="Aucune partie disponible pour l'instant." />
          </div>

          <div v-else class="rooms-list">
            <div v-for="room in waitingRooms" :key="room.id" class="room-item">
              <div class="room-info">
                <span class="room-host"
                  >Hôte : {{ room.hostUsername.slice(0, 10) }}…</span
                >
              </div>
              <div class="room-actions">
                <NSelect
                  v-model:value="joinDeckIds[room.id]"
                  :options="deckOptions"
                  placeholder="Sélectionner un deck"
                  class="join-select"
                  size="small"
                />
                <NButton
                  type="primary"
                  color="#4caf82"
                  size="small"
                  :disabled="!joinDeckIds[room.id] || !isConnected"
                  :loading="joiningRoomId === room.id && isLoading"
                  @click="handleJoinRoom(room)"
                >
                  Rejoindre
                </NButton>
              </div>
            </div>
          </div>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useApi } from '@/composables/useApi'
import { useGameStore } from '@/store/game'
import type { Deck } from '@/types'
import type { Room } from '@/types/game'

import { ROUTES } from '../../router'
import DeckCard from './DeckCard.vue'

const router = useRouter()
const message = useMessage()
const api = useApi()
const gameStore = useGameStore()

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

const deckOptions = computed(() =>
  decks.value.map((deck) => ({
    label: deck.name,
    value: deck.id,
  })),
)

// ─── Game store ───────────────────────────────────────────────────────────────
const isConnected = computed(() => gameStore.isConnected)
const currentRoom = computed(() => gameStore.currentRoom)
const isLoading = computed(() => gameStore.isLoading)
const waitingRooms = computed(() =>
  gameStore.rooms.filter((r: Room) => r.status === 'waiting'),
)

// Deck sélectionné pour créer une partie
const selectedDeckId = ref<number | null>(null)

// Deck sélectionné par room pour rejoindre
const joinDeckIds = reactive<Record<string, number | null>>({})
const joiningRoomId = ref<string | null>(null)

// Afficher les erreurs socket via Naive UI message
watch(
  () => gameStore.error,
  (val) => {
    if (val) {
      message.error(val)
      gameStore.clearError()
    }
  },
)

// ─── Actions jeu ──────────────────────────────────────────────────────────────
function handleCreateRoom() {
  if (!selectedDeckId.value) return
  gameStore.createRoom(String(selectedDeckId.value))
}

function handleJoinRoom(room: Room) {
  const deckId = joinDeckIds[room.id]
  if (!deckId) return
  joiningRoomId.value = room.id
  gameStore.joinRoom(room.id, String(deckId))
}

function handleLeaveRoom() {
  gameStore.leaveRoom()
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function handleNewDeck() {
  router.push(ROUTES.DECK_CREATE)
}

function handleEditDeck(deck: Deck) {
  router.push(ROUTES.DECK_EDIT.replace(':id', String(deck.id)))
}

// ─── Suppression deck ─────────────────────────────────────────────────────────
async function handleDeleteDeck(deck: Deck) {
  decks.value = decks.value.filter((d) => d.id !== deck.id)
  try {
    await api.deleteDeck(deck.id)
    message.success('Deck supprimé.')
  } catch (e) {
    decks.value.push(deck)
    message.error(
      e instanceof Error ? e.message : 'Impossible de supprimer le deck.',
    )
  }
}

// ─── Cycle de vie ─────────────────────────────────────────────────────────────
onMounted(() => {
  fetchDecks()
  gameStore.connect()
})

onUnmounted(() => {
  gameStore.disconnect()
})
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
  margin-bottom: 12px;
}

/* ── Waiting ── */
.waiting-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #555;
  font-size: 13px;
}

.waiting-text {
  color: #555;
  font-size: 13px;
}

/* ── Socket status ── */
.socket-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}

.socket-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.socket-status.connected {
  color: #4caf82;
}

.socket-status.connected .socket-dot {
  background: #4caf82;
}

/* ── Rooms ── */
.empty-games {
  padding: 24px 0;
  text-align: center;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-host {
  font-size: 13px;
  color: #555;
}

.room-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.join-select {
  flex: 1;
}

/* ── Decks ── */
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
