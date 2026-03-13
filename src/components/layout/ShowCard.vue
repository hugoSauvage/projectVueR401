<template>
  <NCard :title="deck.name">
    <template #header-extra>
      <NTag type="info"> {{ deck.cards.length }} cartes </NTag>
    </template>

    <p>Deck ID : {{ deck.id }}</p>

    <p v-if="deck.cards.length === 0">Aucune carte dans ce deck</p>

    <template v-else>
      <p>Cartes :</p>
      <ul>
        <li v-for="card in deck.cards" :key="card.id">Carte #{{ card.id }}</li>
      </ul>
    </template>

    <template #footer>
      <NSpace>
        <NButton type="primary" @click="emit('edit-deck', deck)">
          Modifier
        </NButton>

        <RouterLink :to="`/deck/${deck.id}`">
          <NButton>Détail</NButton>
        </RouterLink>
      </NSpace>
    </template>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NSpace, NTag } from 'naive-ui'
import { RouterLink } from 'vue-router'

import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
}

defineProps<DeckCardProps>()

const emit = defineEmits<{
  'edit-deck': [deck: Deck]
}>()
</script>
