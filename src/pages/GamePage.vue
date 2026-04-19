<template>
  <div class="game-page">
    <!-- ══ RG1 – ZONE ADVERSAIRE (haut) ════════════════════════════════════ -->
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

        <!-- RG3 – Placeholder adversaire -->
        <div v-else class="zone__placeholder">
          <span class="placeholder-icon">🂠</span>
          <span class="placeholder-text">Aucune carte en jeu</span>
        </div>
      </div>
    </section>

    <!-- ══ RG1 – BARRE D'ACTIONS (milieu) ══════════════════════════════════ -->
    <ActionBar
      :is-my-turn="isMyTurn"
      :is-hand-full="isHandFull"
      :is-deck-empty="isDeckEmpty"
      :can-attack="canAttack"
      :last-event="lastEvent"
      @draw="gameStore.drawCards()"
      @attack="gameStore.attack()"
      @end-turn="gameStore.endTurn()"
    />

    <!-- ══ RG1 – ZONE JOUEUR (bas) ══════════════════════════════════════════ -->
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

        <!-- RG3 – Placeholder joueur -->
        <div v-else class="zone__placeholder">
          <span class="placeholder-icon">🂠</span>
          <span class="placeholder-text">Aucune carte en jeu</span>
        </div>
      </div>

      <!-- RG1 – Main du joueur -->
      <PlayerHand
        :cards="myBoard?.hand ?? []"
        :deck-count="myBoard?.deckCount ?? 0"
        :can-play="canPlayCard"
        @play-card="gameStore.playCard($event)"
      />
    </section>

    <!-- ══ RG8 – MODAL FIN DE PARTIE ════════════════════════════════════════ -->
    <GameEndModal
      :show="showEndModal"
      :is-winner="isWinner"
      @back-to-lobby="handleBackToLobby"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import ActionBar from '@/components/layout/ActionBar.vue'
import GameEndModal from '@/components/layout/GameEndModal.vue'
import PlayerHand from '@/components/layout/Playerhand.vue'
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
.game-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

.zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin: 8px 12px 0;
  padding: 10px 12px;
  min-height: 0;
  overflow: hidden;
}

@media (min-width: 640px) {
  .zone {
    padding: 14px 16px;
    margin: 8px 16px 0;
  }
}

.zone--opponent {
  margin-bottom: 0;
}
.zone--player {
  margin-top: 0;
  margin-bottom: 8px;
  flex: 1.6;
}

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
</style>
