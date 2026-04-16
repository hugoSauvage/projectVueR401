import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { GameState, LobbyState, PlayerBoard, Room } from '@/types/game'

const getToken = (): string | null => localStorage.getItem('token')

const INITIAL_GAME_STATE: GameState = {
  roomId: null,
  status: 'lobby',
  currentTurnPlayerId: null,
  myPlayerId: null,
  role: null,
  myBoard: null,
  opponentBoard: null,
  winner: null,
  lastEvent: null,
}

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

  const game = ref<GameState>({ ...INITIAL_GAME_STATE })

  // ─── Getters ───────────────────────────────────────────────────────────────

  const isConnected = computed(() => lobby.value.isConnected)
  const rooms = computed(() => lobby.value.rooms)
  const currentRoom = computed(() => lobby.value.currentRoom)
  const error = computed(() => lobby.value.error)
  const isLoading = computed(() => lobby.value.isLoading)
  const gameStatus = computed(() => game.value.status)

  /** RG1 – Vrai si c'est le tour du joueur courant */
  const isMyTurn = computed(
    () =>
      game.value.currentTurnPlayerId !== null &&
      game.value.currentTurnPlayerId === game.value.myPlayerId,
  )

  /** RG2 – Rôle du joueur (hôte ou invité) */
  const playerRole = computed(() => game.value.role)

  /** RG2 – Plateau du joueur */
  const myBoard = computed(() => game.value.myBoard)

  /** RG2 – Plateau de l'adversaire */
  const opponentBoard = computed(() => game.value.opponentBoard)

  /** Message temps réel (RG7) */
  const lastEvent = computed(() => game.value.lastEvent)

  /** Résultat : vrai si le joueur courant a gagné */
  const isWinner = computed(
    () =>
      game.value.winner !== null && game.value.winner === game.value.myPlayerId,
  )

  // ─── Événements Socket ─────────────────────────────────────────────────────

  function registerSocketEvents() {
    const s = socket.value

    // Connexion
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

    // ── Lobby ──────────────────────────────────────────────────────────────

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
      game.value.role = 'host'
      lobby.value.isLoading = false
    })

    // RG5 – Partie démarrée → /game
    s.on('gameStarted', (data: { roomId: string; playerId: string }) => {
      game.value.roomId = data.roomId
      game.value.myPlayerId = data.playerId
      game.value.status = 'playing'
      // Le rôle guest est assigné au joueur qui a rejoint
      if (!game.value.role) game.value.role = 'guest'
      router.push('/game')
    })

    // ── Partie ─────────────────────────────────────────────────────────────

    // RG4 – Mise à jour de l'état du plateau
    s.on(
      'gameStateUpdated',
      (data: {
        currentTurnPlayerId: string
        players: { id: string; board: PlayerBoard }[]
        lastEvent?: string
      }) => {
        game.value.currentTurnPlayerId = data.currentTurnPlayerId
        if (game.value.lastEvent !== (data.lastEvent ?? null)) {
          game.value.lastEvent = data.lastEvent ?? null
        }

        for (const player of data.players) {
          if (player.id === game.value.myPlayerId) {
            game.value.myBoard = player.board
          } else {
            game.value.opponentBoard = player.board
          }
        }
      },
    )

    // RG5 – Fin de partie
    s.on('gameEnded', (data: { winnerId: string }) => {
      game.value.winner = data.winnerId
      game.value.status = 'finished'
    })

    // Adversaire déconnecté
    s.on('opponentDisconnected', () => {
      game.value.lastEvent = "Votre adversaire s'est déconnecté."
      game.value.status = 'finished'
      game.value.winner = game.value.myPlayerId
    })

    // Erreur serveur
    s.on('error', (message: string) => {
      lobby.value.error = message
      lobby.value.isLoading = false
    })
  }

  // ─── Actions lobby ─────────────────────────────────────────────────────────

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
    game.value.role = null
  }

  function clearError() {
    lobby.value.error = null
  }

  // ─── Actions de jeu ────────────────────────────────────────────────────────

  /** RG3 – Piocher des cartes */
  function drawCards() {
    socket.value?.emit('drawCards', { roomId: game.value.roomId })
  }

  /** RG3 – Jouer une carte */
  function playCard(cardId: number) {
    socket.value?.emit('playCard', { roomId: game.value.roomId, cardId })
  }

  /** RG3 – Attaquer */
  function attack() {
    socket.value?.emit('attack', { roomId: game.value.roomId })
  }

  /** RG3 – Fin de tour */
  function endTurn() {
    socket.value?.emit('endTurn', { roomId: game.value.roomId })
  }

  /** RG6 – Remettre le store à son état initial */
  function resetGame() {
    game.value = { ...INITIAL_GAME_STATE }
    lobby.value.currentRoom = null
  }

  return {
    // State brut
    lobby,
    game,
    // Getters lobby
    isConnected,
    rooms,
    currentRoom,
    error,
    isLoading,
    // Getters partie
    gameStatus,
    isMyTurn,
    playerRole,
    myBoard,
    opponentBoard,
    lastEvent,
    isWinner,
    // Actions lobby
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
    // Actions partie
    drawCards,
    playCard,
    attack,
    endTurn,
    resetGame,
  }
})
