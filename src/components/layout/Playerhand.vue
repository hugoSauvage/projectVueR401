<template>
  <div class="hand">
    <div class="hand__header">
      <span class="hand__label">Main</span>
      <span class="hand__counts">
        {{ cards.length }}/5 cartes · {{ deckCount }} restantes dans le deck
      </span>
    </div>

    <div class="hand__cards">
      <div
        v-for="card in cards"
        :key="card.id"
        class="hand-card"
        :class="{
          'hand-card--playable': canPlay,
          'hand-card--disabled': !canPlay,
        }"
        @click="handlePlay(card.id)"
      >
        <img
          v-if="card.imageUrl"
          :src="card.imageUrl"
          :alt="card.name"
          class="hand-card__img"
        />
        <div v-else class="hand-card__img hand-card__img--placeholder">🃏</div>
        <span class="hand-card__name">{{ card.name }}</span>
      </div>

      <div v-if="cards.length === 0" class="hand__empty">
        Aucune carte en main
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActiveCard } from '@/types/game'

defineOptions({ name: 'PlayerHand' })

const props = defineProps<{
  cards: ActiveCard[]
  deckCount: number
  /** RG2 – Vrai si c'est le tour du joueur et qu'il n'a pas de carte active */
  canPlay: boolean
}>()

const emit = defineEmits<(e: 'play-card', cardId: number) => void>()

/** RG2 – Jouer une carte uniquement si canPlay */
function handlePlay(cardId: number) {
  if (!props.canPlay) return
  emit('play-card', cardId)
}
</script>

<style scoped>
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
</style>
