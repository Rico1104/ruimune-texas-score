export type Page =
  | "home"
  | "createRoom"
  | "joinRoom"
  | "roomLobby"
  | "adminScore"
  | "playerView"
  | "settlement"
  | "my";

export type Role = "admin" | "player";
export type RoomStatus = "waiting" | "playing" | "settled";

export type Room = {
  roomId: string;
  roomName: string;
  adminName: string;
  maxPlayers: number;
  defaultBuyIn: number;
  status: RoomStatus;
  createdAt: string;
};

export type Player = {
  id: string;
  name: string;
  isAdmin: boolean;
  baseBuyIn: number;
  rebuy: number;
};

export type HistoricalPlayer = {
  id: string;
  name: string;
  lastUsedAt: string;
  totalGames: number;
};

export type SavedResultPlayer = {
  name: string;
  baseBuyIn: number;
  rebuy: number;
  total: number;
  rank: number;
};

export type SavedResult = {
  id: string;
  roomId: string;
  roomName: string;
  adminName: string;
  date: string;
  players: SavedResultPlayer[];
  winner: string;
};
