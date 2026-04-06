<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useApi } from '@/composables/useApi'
import { useGameStore } from '@/store/game'
import type { Deck } from '@/types'
import type { Room } from '@/types/game'

// Forcer le nom multi-mot pour ESLint vue/multi-word-component-names
defineOptions({ name: 'GameLobby' })

// ─── Store & composables ──────────────────────────────────────────────────────
const gameStore = useGameStore()
const api = useApi()

// ─── State local ──────────────────────────────────────────────────────────────
const selectedDeckId = ref<string>('')
const decks = ref<Deck[]>([])
const activeTab = ref<'join' | 'create'>('join')
const joiningRoomId = ref<string | null>(null)

// ─── Getters du store ─────────────────────────────────────────────────────────
const rooms = computed(() => gameStore.rooms)
const isConnected = computed(() => gameStore.isConnected)
const currentRoom = computed(() => gameStore.currentRoom)
const error = computed(() => gameStore.error)
const isLoading = computed(() => gameStore.isLoading)

// ─── Cycle de vie ─────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const result = await api.getMyDecks()
    decks.value = result ?? []
    if (decks.value.length > 0) {
      selectedDeckId.value = String(decks.value[0].id)
    }
  } catch {
    decks.value = []
  }

  // RG1 + RG2 – Connexion et chargement des rooms
  gameStore.connect()
})

onUnmounted(() => {
  gameStore.disconnect()
})

// Fermer l'erreur automatiquement après 5 s
watch(error, (val) => {
  if (val) setTimeout(() => gameStore.clearError(), 5000)
})

// ─── Actions ──────────────────────────────────────────────────────────────────
function handleCreateRoom() {
  if (!selectedDeckId.value) return
  gameStore.createRoom(selectedDeckId.value)
}

function handleJoinRoom(room: Room) {
  if (!selectedDeckId.value) return
  joiningRoomId.value = room.id
  gameStore.joinRoom(room.id, selectedDeckId.value)
}

function handleLeaveRoom() {
  gameStore.leaveRoom()
  joiningRoomId.value = null
}

const hasDeck = computed(
  () => decks.value.length > 0 && selectedDeckId.value !== '',
)
const waitingRooms = computed(() =>
  rooms.value.filter((r) => r.status === 'waiting'),
)
</script>

<template>
  <section class="lobby">
    <!-- ── En-tête ── -->
    <div class="lobby__header">
      <div class="lobby__title-group">
        <span class="lobby__icon">⚔️</span>
        <h2 class="lobby__title">Arène</h2>
      </div>

      <div
        class="lobby__status"
        :class="{ 'lobby__status--online': isConnected }"
      >
        <span class="lobby__status-dot" />
        <span class="lobby__status-label">{{
          isConnected ? 'Connecté' : 'Déconnecté'
        }}</span>
      </div>
    </div>

    <!-- ── Erreur ── -->
    <Transition name="slide-down">
      <div v-if="error" class="lobby__error" role="alert">
        <span>⚠️ {{ error }}</span>
        <button class="lobby__error-close" @click="gameStore.clearError()">
          ✕
        </button>
      </div>
    </Transition>

    <!-- ── Room actuelle (en attente) ── -->
    <Transition name="fade">
      <div v-if="currentRoom" class="lobby__waiting-room">
        <div class="lobby__waiting-room-inner">
          <div class="lobby__waiting-animation">
            <span class="pokeball" />
          </div>
          <p class="lobby__waiting-text">
            Room
            <strong>{{ currentRoom.name ?? currentRoom.id }}</strong>
            créée.<br />
            En attente d'un adversaire…
          </p>
          <button class="lobby__btn lobby__btn--ghost" @click="handleLeaveRoom">
            Quitter la room
          </button>
        </div>
      </div>
    </Transition>

    <template v-if="!currentRoom">
      <!-- ── Sélection du deck ── -->
      <div class="lobby__section">
        <label class="lobby__label" for="deck-select">Choisir votre deck</label>

        <div v-if="decks.length === 0" class="lobby__no-deck">
          Aucun deck disponible. Créez-en un avant de jouer.
        </div>

        <select
          v-else
          id="deck-select"
          v-model="selectedDeckId"
          class="lobby__select"
          :disabled="!isConnected"
        >
          <option v-for="deck in decks" :key="deck.id" :value="deck.id">
            {{ deck.name }}
          </option>
        </select>
      </div>

      <!-- ── Onglets ── -->
      <div class="lobby__tabs">
        <button
          class="lobby__tab"
          :class="{ 'lobby__tab--active': activeTab === 'join' }"
          @click="activeTab = 'join'"
        >
          Rejoindre
        </button>
        <button
          class="lobby__tab"
          :class="{ 'lobby__tab--active': activeTab === 'create' }"
          @click="activeTab = 'create'"
        >
          Créer
        </button>
      </div>

      <!-- ── Onglet : Rejoindre ── -->
      <div v-if="activeTab === 'join'" class="lobby__panel">
        <div v-if="!isConnected" class="lobby__placeholder">
          Connexion au serveur…
        </div>

        <div v-else-if="waitingRooms.length === 0" class="lobby__placeholder">
          Aucune room disponible pour le moment.<br />
          <button class="lobby__link" @click="activeTab = 'create'">
            Créer une room
          </button>
        </div>

        <ul v-else class="lobby__rooms">
          <li
            v-for="room in waitingRooms"
            :key="room.id"
            class="lobby__room-card"
          >
            <div class="lobby__room-info">
              <span class="lobby__room-name">{{ room.hostUsername }}</span>
              <span class="lobby__room-meta">
                {{ room.playerCount }}/{{ room.maxPlayers }} joueur(s)
              </span>
            </div>

            <button
              class="lobby__btn lobby__btn--primary"
              :disabled="!hasDeck || isLoading"
              :class="{
                'lobby__btn--loading': joiningRoomId === room.id && isLoading,
              }"
              @click="handleJoinRoom(room)"
            >
              <span v-if="joiningRoomId === room.id && isLoading">…</span>
              <span v-else>Rejoindre</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- ── Onglet : Créer ── -->
      <div v-if="activeTab === 'create'" class="lobby__panel">
        <p class="lobby__create-hint">
          Créez une room et attendez qu'un adversaire vous rejoigne. La partie
          démarrera automatiquement.
        </p>

        <button
          class="lobby__btn lobby__btn--primary lobby__btn--full"
          :disabled="!hasDeck || !isConnected || isLoading"
          @click="handleCreateRoom"
        >
          <span v-if="isLoading">Création…</span>
          <span v-else>⚔️ Créer la room</span>
        </button>

        <p v-if="!hasDeck" class="lobby__hint-warning">
          Sélectionnez un deck pour continuer.
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* ── Tokens ── */
.lobby {
  --c-bg: #0f1117;
  --c-surface: #181c28;
  --c-surface-2: #1e2335;
  --c-border: #2a3050;
  --c-accent: #e8b84b;
  --c-accent-dim: rgba(232, 184, 75, 0.15);
  --c-red: #e84b4b;
  --c-green: #4be87a;
  --c-text: #e0e6f0;
  --c-text-muted: #6b7a99;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.5);

  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  max-width: 480px;
  width: 100%;
  color: var(--c-text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  box-shadow: var(--shadow);
}

/* ── Header ── */
.lobby__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.lobby__title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lobby__icon {
  font-size: 1.4rem;
}

.lobby__title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--c-accent);
  margin: 0;
}

/* ── Status badge ── */
.lobby__status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--c-text-muted);
  background: var(--c-bg);
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  border: 1px solid var(--c-border);
}

.lobby__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-red);
  transition: background 0.3s;
}

.lobby__status--online .lobby__status-dot {
  background: var(--c-green);
  box-shadow: 0 0 6px var(--c-green);
  animation: pulse 2s infinite;
}

.lobby__status--online .lobby__status-label {
  color: var(--c-green);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ── Error banner ── */
.lobby__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(232, 75, 75, 0.12);
  border: 1px solid rgba(232, 75, 75, 0.4);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  color: #f08080;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.lobby__error-close {
  background: none;
  border: none;
  color: #f08080;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

/* ── Waiting room ── */
.lobby__waiting-room {
  background: var(--c-bg);
  border: 1px dashed var(--c-accent);
  border-radius: var(--radius);
  padding: 2rem 1.5rem;
  text-align: center;
}

.lobby__waiting-room-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.lobby__waiting-animation {
  position: relative;
  width: 56px;
  height: 56px;
}

.pokeball {
  display: block;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: conic-gradient(#e84b4b 0deg 180deg, #fff 180deg 360deg);
  border: 3px solid #333;
  position: relative;
  animation: spin 2s linear infinite;
}

.pokeball::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 3px;
  background: #333;
  transform: translateY(-50%);
}

.pokeball::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  border: 3px solid #333;
  transform: translate(-50%, -50%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.lobby__waiting-text {
  font-size: 0.9rem;
  color: var(--c-text-muted);
  line-height: 1.6;
  margin: 0;
}

.lobby__waiting-text strong {
  color: var(--c-accent);
}

/* ── Section deck ── */
.lobby__section {
  margin-bottom: 1.25rem;
}

.lobby__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  margin-bottom: 0.5rem;
}

.lobby__select {
  width: 100%;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  color: var(--c-text);
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7a99' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.85rem center;
  padding-right: 2.2rem;
}

.lobby__select:focus {
  border-color: var(--c-accent);
}

.lobby__select:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lobby__no-deck {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 0.7rem 1rem;
}

/* ── Tabs ── */
.lobby__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  background: var(--c-bg);
  border-radius: var(--radius-sm);
  padding: 0.2rem;
  margin-bottom: 1rem;
}

.lobby__tab {
  background: none;
  border: none;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.55rem;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all 0.2s;
}

.lobby__tab--active {
  background: var(--c-surface-2);
  color: var(--c-accent);
}

/* ── Panel ── */
.lobby__panel {
  min-height: 160px;
}

/* ── Placeholder ── */
.lobby__placeholder {
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  padding: 2.5rem 1rem;
  line-height: 1.8;
}

.lobby__link {
  background: none;
  border: none;
  color: var(--c-accent);
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;
  padding: 0;
}

/* ── Room list ── */
.lobby__rooms {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lobby__room-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  transition: border-color 0.2s;
}

.lobby__room-card:hover {
  border-color: var(--c-accent);
}

.lobby__room-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.lobby__room-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.lobby__room-meta {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

/* ── Create panel ── */
.lobby__create-hint {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  line-height: 1.6;
  margin: 0 0 1.25rem;
}

.lobby__hint-warning {
  font-size: 0.78rem;
  color: var(--c-red);
  margin: 0.5rem 0 0;
  text-align: center;
}

/* ── Buttons ── */
.lobby__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.55rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.lobby__btn--primary {
  background: var(--c-accent);
  color: #0f1117;
}

.lobby__btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(232, 184, 75, 0.35);
}

.lobby__btn--primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.lobby__btn--ghost {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
}

.lobby__btn--ghost:hover {
  border-color: var(--c-red);
  color: var(--c-red);
}

.lobby__btn--full {
  width: 100%;
}

.lobby__btn--loading {
  opacity: 0.7;
}

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
