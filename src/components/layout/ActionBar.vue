<template>
  <section class="action-bar">
    <!-- RG3 – Indicateur de tour -->
    <div class="turn-indicator" :class="{ 'turn-indicator--mine': isMyTurn }">
      <span class="turn-dot" />
      <span class="turn-label">
        {{ isMyTurn ? 'Votre tour' : "Tour de l'adversaire" }}
      </span>
    </div>

    <!-- RG7 – Message temps réel -->
    <div v-if="lastEvent" class="last-event">
      {{ lastEvent }}
    </div>

    <!-- Actions -->
    <div class="action-bar__buttons">
      <!-- RG4 – Piocher : désactivé si main pleine ou deck vide -->
      <NButton
        type="default"
        :disabled="!isMyTurn || isHandFull || isDeckEmpty"
        @click="emit('draw')"
      >
        🃏 Piocher
      </NButton>

      <!-- RG5 – Attaquer : désactivé si un joueur n'a pas de carte active -->
      <NButton
        type="primary"
        color="#4caf82"
        :disabled="!isMyTurn || !canAttack"
        @click="emit('attack')"
      >
        ⚔️ Attaquer
      </NButton>

      <!-- RG6 – Fin de tour : désactivé si pas mon tour -->
      <NButton type="default" :disabled="!isMyTurn" @click="emit('end-turn')">
        ⏭ Fin de tour
      </NButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'

defineOptions({ name: 'ActionBar' })

defineProps<{
  isMyTurn: boolean
  isHandFull: boolean // RG4 – main pleine (5 cartes)
  isDeckEmpty: boolean // RG4 – deck vide
  canAttack: boolean // RG5 – les deux joueurs ont une carte active
  lastEvent: string | null // RG7 – message temps réel
}>()

const emit = defineEmits<(e: 'draw' | 'attack' | 'end-turn') => void>()
</script>

<style scoped>
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
</style>
