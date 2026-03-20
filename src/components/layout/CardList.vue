<template>
  <div class="card-grid" :class="`size-${size}`">
    <PokemonList
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :size="size"
      :is-selected="selectedIds.includes(card.id)"
      :is-disabled="!selectedIds.includes(card.id) && isMaxReached"
      @toggle="handleToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Card } from '@/types'

import PokemonList from './PokemonCard.vue'

const props = defineProps<{
  cards: Card[]
  selectedIds: number[]
  maxSelection?: number
  size?: 'sm' | 'md'
}>()

const emit = defineEmits<(e: 'update:selected-ids', ids: number[]) => void>()

const isMaxReached = computed(
  () =>
    props.maxSelection !== undefined &&
    props.selectedIds.length >= props.maxSelection,
)

function handleToggle(card: Card) {
  const current = [...props.selectedIds]
  const idx = current.indexOf(card.id)
  if (idx === -1) {
    if (isMaxReached.value) return
    emit('update:selected-ids', [...current, card.id])
  } else {
    current.splice(idx, 1)
    emit('update:selected-ids', current)
  }
}
</script>

<style scoped>
.card-grid {
  display: grid;
  gap: 12px;
}
.size-md {
  grid-template-columns: repeat(6, 1fr);
}
.size-sm {
  grid-template-columns: repeat(10, 1fr);
}

@media (max-width: 900px) {
  .size-md {
    grid-template-columns: repeat(4, 1fr);
  }
  .size-sm {
    grid-template-columns: repeat(6, 1fr);
  }
}
@media (max-width: 580px) {
  .size-md {
    grid-template-columns: repeat(3, 1fr);
  }
  .size-sm {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
