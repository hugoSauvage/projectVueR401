<template>
  <div>
    <DeckCard
      v-for="deck in decks"
      :key="deck.id"
      :deck="deck"
      @edit-deck="emit('edit-deck', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Deck } from '@/types'

import DeckCard from '../layout/DeckCard.vue'

defineProps<{
  decks: Deck[]
}>()

const emit = defineEmits<{
  'edit-deck': [deck: Deck]
}>()
</script>
