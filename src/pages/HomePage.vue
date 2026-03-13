<template>
  <div class="container">
    <NEmpty description="Page d'accueil à implémenter (tickets 2 et 3)" />
    <ShowList :decks="decks" />
  </div>
</template>

<script setup lang="ts">
import ShowList from '../components/layout/ShowList.vue'

const decks = [
  {
    id: 1,
    name: 'Deck test',
    userId: 1,
    cards: [],
  },
]
</script>
