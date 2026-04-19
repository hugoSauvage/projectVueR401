// ─── Lobby ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string
  hostId: string
  hostUsername: string
  status: 'waiting' | 'starting' | 'in_progress'
  playerCount: number
  maxPlayers: 2
  createdAt: string
}

export interface LobbyState {
  rooms: Room[]
  currentRoom: Room | null
  isConnected: boolean
  error: string | null
  isLoading: boolean
}

// ─── Partie ───────────────────────────────────────────────────────────────────

export interface ActiveCard {
  id: number
  name: string
  hp: number
  maxHp: number
  imageUrl?: string
}

export interface PlayerBoard {
  playerId: string
  username: string
  kos: number // nombre de KOs (0 à 3)
  activeCard: ActiveCard | null
  handCount: number // nb de cartes en main
  deckCount: number // nb de cartes restantes dans le deck
  hand: ActiveCard[] // cartes en main (max 5)
}

export type PlayerRole = 'host' | 'guest'

export interface GameState {
  roomId: string | null
  status: 'lobby' | 'playing' | 'finished'
  currentTurnPlayerId: string | null // id du joueur dont c'est le tour
  myPlayerId: string | null // id du joueur courant (moi)
  role: PlayerRole | null // hôte ou invité
  myBoard: PlayerBoard | null
  opponentBoard: PlayerBoard | null
  winner: string | null // playerId du gagnant
  lastEvent: string | null // message temps réel (RG7)
}
