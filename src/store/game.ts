import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { GameState, LobbyState, Room } from '@/types/game'

const getToken = (): string | null => localStorage.getItem('token')

export const useGameStore = defineStore('game', () => {
  const router = useRouter()

  // ─── State ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socket = ref<any>(null)

  const lobby = ref<LobbyState>({
    rooms: [],
    currentRoom: null,
    isConnected: false,
    error: null,
    isLoading: false,
  })

  const game = ref<GameState>({
    roomId: null,
    players: [],
    currentTurn: null,
    status: 'lobby',
    winner: null,
  })

  // ─── Getters ───────────────────────────────────────────────────────────────

  const isConnected = computed(() => lobby.value.isConnected)
  const rooms = computed(() => lobby.value.rooms)
  const currentRoom = computed(() => lobby.value.currentRoom)
  const error = computed(() => lobby.value.error)
  const isLoading = computed(() => lobby.value.isLoading)
  const gameStatus = computed(() => game.value.status)

  // ─── Événements Socket (déclarée AVANT connect pour ESLint) ────────────────

  function registerSocketEvents() {
    const s = socket.value

    s.on('connect', () => {
      lobby.value.isConnected = true
      lobby.value.error = null
    })

    s.on('disconnect', () => {
      lobby.value.isConnected = false
    })

    s.on('connect_error', (err: Error) => {
      lobby.value.isConnected = false
      lobby.value.error = `Erreur de connexion : ${err.message}`
    })

    // RG2 – Liste initiale
    s.on('roomsList', (data: Room[]) => {
      lobby.value.rooms = data
      lobby.value.isLoading = false
    })

    // RG2 – Mise à jour temps réel
    s.on('roomsListUpdated', (data: Room[]) => {
      lobby.value.rooms = data
    })

    // RG3 – Room créée
    s.on('roomCreated', (room: Room) => {
      lobby.value.currentRoom = room
      game.value.roomId = room.id
      lobby.value.isLoading = false
    })

    // RG5 – Partie démarrée → /game
    s.on('gameStarted', (data: { roomId: string }) => {
      game.value.roomId = data.roomId
      game.value.status = 'playing'
      router.push('/game')
    })

    s.on('error', (message: string) => {
      lobby.value.error = message
      lobby.value.isLoading = false
    })
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /** RG1 – Connexion Socket.io authentifiée via JWT */
  function connect() {
    const token = getToken()
    if (!token) {
      lobby.value.error = 'Vous devez être connecté pour accéder au lobby.'
      return
    }
    if (socket.value?.connected) return

    socket.value = io(
      import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
      {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    )

    registerSocketEvents()
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    lobby.value.isConnected = false
  }

  /** RG3 – Créer une room */
  function createRoom(deckId: string) {
    if (!socket.value?.connected) {
      lobby.value.error = 'Non connecté au serveur.'
      return
    }
    lobby.value.isLoading = true
    socket.value.emit('createRoom', { deckId })
  }

  /** RG4 – Rejoindre une room */
  function joinRoom(roomId: string, deckId: string) {
    if (!socket.value?.connected) {
      lobby.value.error = 'Non connecté au serveur.'
      return
    }
    lobby.value.isLoading = true
    socket.value.emit('joinRoom', { roomId, deckId })
  }

  function leaveRoom() {
    if (socket.value?.connected && lobby.value.currentRoom) {
      socket.value.emit('leaveRoom', { roomId: lobby.value.currentRoom.id })
    }
    lobby.value.currentRoom = null
    game.value.roomId = null
  }

  function clearError() {
    lobby.value.error = null
  }

  return {
    lobby,
    game,
    socket,
    isConnected,
    rooms,
    currentRoom,
    error,
    isLoading,
    gameStatus,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
  }
})
