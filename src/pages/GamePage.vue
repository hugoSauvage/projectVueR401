<template>
  <div class="game-page">
    <!-- ══ ZONE ADVERSAIRE (haut) ══════════════════════════════════════════ -->
    <section class="zone zone--opponent">
      <div class="zone__header">
        <span class="zone__label">Adversaire</span>
        <div class="zone__score">
          <span
            v-for="n in 3"
            :key="n"
            class="ko-pip"
            :class="{ 'ko-pip--filled': n <= (opponentBoard?.kos ?? 0) }"
          />
          <span class="zone__kos">{{ opponentBoard?.kos ?? 0 }} KO</span>
        </div>
      </div>

      <div class="zone__board">
        <!-- Carte active adversaire -->
        <div v-if="opponentBoard?.activeCard" class="active-card">
          <img
            v-if="opponentBoard.activeCard.imageUrl"
            :src="opponentBoard.activeCard.imageUrl"
            :alt="opponentBoard.activeCard.name"
            class="active-card__img"
          />
          <div v-else class="active-card__img active-card__img--placeholder">
            🃏
          </div>
          <div class="active-card__info">
            <span class="active-card__name">{{
              opponentBoard.activeCard.name
            }}</span>
            <div class="hp-bar">
              <div
                class="hp-bar__fill"
                :class="hpClass(opponentBoard.activeCard)"
                :style="{ width: hpPercent(opponentBoard.activeCard) + '%' }"
              />
            </div>
            <span class="hp-text">
              {{ opponentBoard.activeCard.hp }} /
              {{ opponentBoard.activeCard.maxHp }} HP
            </span>
          </div>
        </div>

        <!-- Placeholder adversaire -->
        <div v-else class="zone__placeholder">
          <span class="placeholder-icon">🂠</span>
          <span class="placeholder-text">Aucune carte en jeu</span>
        </div>
      </div>
    </section>

    <!-- ══ BARRE D'ACTIONS (milieu) ════════════════════════════════════════ -->
    <section class="action-bar">
      <!-- Indicateur de tour -->
      <div class="turn-indicator" :class="{ 'turn-indicator--mine': isMyTurn }">
        <span class="turn-dot" />
        <span class="turn-label">
          {{ isMyTurn ? 'Votre tour' : "Tour de l'adversaire" }}
        </span>
      </div>

      <!-- Message temps réel (RG7) -->
      <div v-if="lastEvent" class="last-event">
        {{ lastEvent }}
      </div>

      <!-- Actions -->
      <div class="action-bar__buttons">
        <!-- Piocher : désactivé si main pleine (5) ou deck vide (RG4) -->
        <NButton
          type="default"
          :disabled="!isMyTurn || isHandFull || isDeckEmpty"
          @click="gameStore.drawCards()"
        >
          🃏 Piocher
        </NButton>

        <!-- Attaquer : désactivé si une carte manque (RG5) -->
        <NButton
          type="primary"
          color="#4caf82"
          :disabled="!isMyTurn || !canAttack"
          @click="gameStore.attack()"
        >
          ⚔️ Attaquer
        </NButton>

        <!-- Fin de tour (RG6) -->
        <NButton
          type="default"
          :disabled="!isMyTurn"
          @click="gameStore.endTurn()"
        >
          ⏭ Fin de tour
        </NButton>
      </div>
    </section>

    <!-- ══ ZONE JOUEUR (bas) ════════════════════════════════════════════════ -->
    <section class="zone zone--player">
      <div class="zone__header">
        <span class="zone__label">Vous</span>
        <div class="zone__score">
          <span
            v-for="n in 3"
            :key="n"
            class="ko-pip"
            :class="{ 'ko-pip--filled': n <= (myBoard?.kos ?? 0) }"
          />
          <span class="zone__kos">{{ myBoard?.kos ?? 0 }} KO</span>
        </div>
      </div>

      <div class="zone__board">
        <!-- Carte active joueur -->
        <div v-if="myBoard?.activeCard" class="active-card">
          <img
            v-if="myBoard.activeCard.imageUrl"
            :src="myBoard.activeCard.imageUrl"
            :alt="myBoard.activeCard.name"
            class="active-card__img"
          />
          <div v-else class="active-card__img active-card__img--placeholder">
            🃏
          </div>
          <div class="active-card__info">
            <span class="active-card__name">{{ myBoard.activeCard.name }}</span>
            <div class="hp-bar">
              <div
                class="hp-bar__fill"
                :class="hpClass(myBoard.activeCard)"
                :style="{ width: hpPercent(myBoard.activeCard) + '%' }"
              />
            </div>
            <span class="hp-text">
              {{ myBoard.activeCard.hp }} / {{ myBoard.activeCard.maxHp }} HP
            </span>
          </div>
        </div>

        <!-- Placeholder joueur -->
        <div v-else class="zone__placeholder">
          <span class="placeholder-icon">🂠</span>
          <span class="placeholder-text">Aucune carte en jeu</span>
        </div>
      </div>

      <!-- ── Main du joueur ── -->
      <div class="hand">
        <div class="hand__header">
          <span class="hand__label">Main</span>
          <span class="hand__counts">
            {{ myBoard?.hand?.length ?? 0 }}/5 cartes ·
            {{ myBoard?.deckCount ?? 0 }} restantes dans le deck
          </span>
        </div>

        <div class="hand__cards">
          <!-- Cartes en main (max 5) -->
          <div
            v-for="card in myBoard?.hand ?? []"
            :key="card.id"
            class="hand-card"
            :class="{
              'hand-card--playable': canPlayCard,
              'hand-card--disabled': !canPlayCard,
            }"
            @click="handlePlayCard(card.id)"
          >
            <img
              v-if="card.imageUrl"
              :src="card.imageUrl"
              :alt="card.name"
              class="hand-card__img"
            />
            <div v-else class="hand-card__img hand-card__img--placeholder">
              🃏
            </div>
            <span class="hand-card__name">{{ card.name }}</span>
          </div>

          <!-- Placeholder main vide -->
          <div v-if="(myBoard?.hand?.length ?? 0) === 0" class="hand__empty">
            Aucune carte en main
          </div>
        </div>
      </div>
    </section>

    <!-- ══ MODAL FIN DE PARTIE ══════════════════════════════════════════════ -->
    <NModal v-model:show="showEndModal" :mask-closable="false">
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
          <NButton
            type="primary"
            color="#4caf82"
            size="large"
            @click="handleBackToLobby"
          >
            Retour au lobby
          </NButton>
        </div>
      </NCard>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '@/store/game'
import type { ActiveCard } from '@/types/game'

defineOptions({ name: 'GamePage' })

const router = useRouter()
const gameStore = useGameStore()

// ─── Getters store ────────────────────────────────────────────────────────────
const isMyTurn = computed(() => gameStore.isMyTurn)
const myBoard = computed(() => gameStore.myBoard)
const opponentBoard = computed(() => gameStore.opponentBoard)
const lastEvent = computed(() => gameStore.lastEvent)
const isWinner = computed(() => gameStore.isWinner)
const gameStatus = computed(() => gameStore.gameStatus)

// ─── Règles de gestion ────────────────────────────────────────────────────────

/** RG4 – Main pleine (5 cartes) */
const isHandFull = computed(() => (myBoard.value?.hand?.length ?? 0) >= 5)

/** RG4 – Deck vide */
const isDeckEmpty = computed(() => (myBoard.value?.deckCount ?? 0) === 0)

/** RG5 – Les deux joueurs doivent avoir une carte active */
const canAttack = computed(
  () => !!myBoard.value?.activeCard && !!opponentBoard.value?.activeCard,
)

/** RG2 – Jouer une carte : tour du joueur et pas de carte active */
const canPlayCard = computed(() => isMyTurn.value && !myBoard.value?.activeCard)

// ─── Modal fin de partie (RG8) ────────────────────────────────────────────────
const showEndModal = ref(false)

watch(gameStatus, (val) => {
  if (val === 'finished') showEndModal.value = true
})

// ─── Actions ──────────────────────────────────────────────────────────────────

/** RG2 – Jouer une carte uniquement si c'est le tour et pas de carte active */
function handlePlayCard(cardId: number) {
  if (!canPlayCard.value) return
  gameStore.playCard(cardId)
}

/** RG9 – Retour au lobby */
function handleBackToLobby() {
  gameStore.resetGame()
  router.push('/')
}

// ─── Helpers HP ───────────────────────────────────────────────────────────────
function hpPercent(card: ActiveCard): number {
  if (!card.maxHp) return 0
  return Math.max(0, Math.round((card.hp / card.maxHp) * 100))
}

function hpClass(card: ActiveCard): string {
  const pct = hpPercent(card)
  if (pct > 50) return 'hp-bar__fill--high'
  if (pct > 25) return 'hp-bar__fill--mid'
  return 'hp-bar__fill--low'
}
</script>

<style scoped>
/* ── Layout général ── */
.game-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

/* ── Zones (adversaire + joueur) ── */
.zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin: 8px 12px 0;
  padding: 14px 16px;
  min-height: 0;
  overflow: hidden;
}

.zone--opponent {
  margin-bottom: 0;
}

.zone--player {
  margin-top: 0;
  margin-bottom: 8px;
  flex: 1.6;
}

/* ── Header de zone ── */
.zone__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.zone__label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.zone__score {
  display: flex;
  align-items: center;
  gap: 5px;
}

.zone__kos {
  font-size: 12px;
  color: #888;
  margin-left: 4px;
}

/* ── KO pips ── */
.ko-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #ccc;
  background: #fff;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.ko-pip--filled {
  background: #4caf82;
  border-color: #4caf82;
}

/* ── Carte active ── */
.zone__board {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.active-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 14px;
  width: 100%;
  max-width: 340px;
}

.active-card__img {
  width: 60px;
  height: 84px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
  flex-shrink: 0;
}

.active-card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: #f0f0f0;
}

.active-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.active-card__name {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── HP bar ── */
.hp-bar {
  height: 7px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.hp-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.hp-bar__fill--high {
  background: #4caf82;
}
.hp-bar__fill--mid {
  background: #f0a500;
}
.hp-bar__fill--low {
  background: #e05252;
}

.hp-text {
  font-size: 11px;
  color: #888;
}

/* ── Placeholder ── */
.zone__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #bbb;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 20px 40px;
}

.placeholder-icon {
  font-size: 2rem;
  opacity: 0.4;
}

.placeholder-text {
  font-size: 12px;
}

/* ── Barre d'actions ── */
.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.turn-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  padding: 5px 10px;
  border-radius: 20px;
  background: #f5f5f5;
  border: 1px solid #eee;
}

.turn-indicator--mine {
  color: #4caf82;
  background: #f0faf5;
  border-color: #c3e8d5;
}

.turn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.last-event {
  flex: 1;
  font-size: 12px;
  color: #777;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-bar__buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Main du joueur ── */
.hand {
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.hand__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.hand__label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hand__counts {
  font-size: 11px;
  color: #aaa;
}

.hand__cards {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.hand__empty {
  font-size: 12px;
  color: #bbb;
  padding: 8px 0;
}

/* ── Carte en main ── */
.hand-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1.5px solid #eee;
  padding: 6px;
  background: #fafafa;
  transition:
    border-color 0.2s,
    transform 0.15s,
    box-shadow 0.15s;
  width: 72px;
}

.hand-card--playable {
  cursor: pointer;
}

.hand-card--playable:hover {
  border-color: #4caf82;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(76, 175, 130, 0.2);
}

.hand-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hand-card__img {
  width: 56px;
  height: 78px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

.hand-card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  background: #f0f0f0;
}

.hand-card__name {
  font-size: 10px;
  color: #555;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* ── Modal fin de partie ── */
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
