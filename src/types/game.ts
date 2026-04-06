export interface Room {
  id: string
  name: string
  hostId: string
  hostUsername: string
  status: 'waiting' | 'starting' | 'in_progress'
  playerCount: number
  maxPlayers: 2
  createdAt: string
}

export interface GamePlayer {
  id: string
  username: string
  deckId: string
  isReady: boolean
}

export interface GameState {
  roomId: string | null
  players: GamePlayer[]
  currentTurn: string | null
  status: 'lobby' | 'starting' | 'playing' | 'finished'
  winner: string | null
}

export interface LobbyState {
  rooms: Room[]
  currentRoom: Room | null
  isConnected: boolean
  error: string | null
  isLoading: boolean
}
