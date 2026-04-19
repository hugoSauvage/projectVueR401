<template>
  <div
    class="pokemon-card"
    :class="[`size-${size}`, { selected: isSelected, disabled: isDisabled }]"
    @click="!isDisabled && emit('toggle', card)"
  >
    <div class="card-inner">
      <img :src="card.imgUrl" :alt="card.name" class="card-img" />
      <span class="pokedex-number"
        >#{{ String(card.pokedexNumber).padStart(3, '0') }}</span
      >
      <p class="card-name">{{ card.name }}</p>
      <span
        class="card-type"
        :style="{ backgroundColor: TYPE_COLORS[card.type] }"
      >
        {{ card.type }}
      </span>

      <div class="card-stats">
        <span>❤️ {{ card.hp }}</span>
        <span>⚔️ {{ card.attack }}</span>
      </div>

      <div v-if="currentHp !== undefined" class="hp-bar-wrapper">
        <div
          class="hp-bar"
          :style="{ width: `${Math.min(100, (currentHp / card.hp) * 100)}%` }"
          :class="hpBarColor"
        />
      </div>
    </div>
    <div v-if="isSelected" class="selected-overlay">✓</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Card, PokemonType } from '@/types'

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#A8A878',
  Fire: '#F08030',
  Water: '#6890F0',
  Electric: '#F8D030',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Dark: '#705848',
  Steel: '#B8B8D0',
  Fairy: '#EE99AC',
}

const props = defineProps<{
  card: Card
  size?: 'sm' | 'md'
  isSelected?: boolean
  isDisabled?: boolean
  currentHp?: number
}>()

const emit = defineEmits<(e: 'toggle', card: Card) => void>()

const hpBarColor = computed(() => {
  if (props.currentHp === undefined) return ''
  const pct = (props.currentHp / props.card.hp) * 100
  if (pct > 50) return 'hp-green'
  if (pct > 20) return 'hp-orange'
  return 'hp-red'
})
</script>

<style scoped>
.pokemon-card {
  position: relative;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: #fff;
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.15s,
    opacity 0.15s;
  user-select: none;
}

/* RG2 : tailles */
.size-md {
  padding: 10px;
}
.size-sm {
  padding: 6px;
}

.size-md .card-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
}
.size-sm .card-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
}

.pokemon-card:hover:not(.disabled) {
  transform: translateY(-3px);
  border-color: #4caf82;
}

/* RG3 : sélectionné */
.pokemon-card.selected {
  border-color: #4caf82;
  background: #f0faf5;
}

/* RG3 : désactivé */
.pokemon-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pokedex-number {
  font-size: 10px;
  color: #aaa;
}

.card-name {
  font-weight: 600;
  font-size: 12px;
  margin: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.size-sm .card-name {
  font-size: 10px;
}

.card-type {
  font-size: 10px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}

.card-stats {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #555;
}

/* RG4 : barre HP */
.hp-bar-wrapper {
  width: 100%;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 4px;
}

.hp-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.hp-green {
  background: #4caf82;
}
.hp-orange {
  background: #ff9800;
}
.hp-red {
  background: #f44336;
}

/* RG3 : overlay checkmark */
.selected-overlay {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 14px;
  color: #4caf82;
  font-weight: 700;
}
</style>
