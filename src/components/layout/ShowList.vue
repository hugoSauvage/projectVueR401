<template>
  <NSpace vertical :size="16">
    <slot></slot>

    <p v-if="decks.length === 0">Aucun deck pour l'instant.</p>

    <NGrid :cols="3" :x-gap="16" :y-gap="16">
      <NGi v-for="deck in decks" :key="deck.id">
        <DeckCardComponent
          :deck="deck"
          @edit-deck="emit('edit-deck', $event)"
        />
      </NGi>
    </NGrid>
  </NSpace>
</template>

<script setup lang="ts">
import { NGi, NGrid, NSpace } from 'naive-ui'

import type { Deck } from '@/types'

import DeckCardComponent from './ShowCard.vue'

interface DeckListProps {
  decks: Deck[]
}

defineProps<DeckListProps>()

const emit = defineEmits<{
  'edit-deck': [deck: Deck]
}>()
</script>
