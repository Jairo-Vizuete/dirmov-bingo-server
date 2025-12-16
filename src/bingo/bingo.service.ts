import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BingoCard,
  BingoNumber,
  Player,
  PublicRoomState,
  Room,
} from './types/bingo.types';
import { CardService } from './card.service';

const ROOM_ID = 'DIRMOV-BINGO-ROOM';

@Injectable()
export class BingoService {
  private room: Room;
  private winnerId?: string;

  constructor(private readonly cardService: CardService) {
    const now = new Date();
    this.room = {
      id: ROOM_ID,
      hostId: null,
      hostName: null,
      hostSecret: null,
      players: [],
      drawnNumbers: [],
      state: 'waiting',
      createdAt: now,
      updatedAt: now,
    };
  }

  createHost(
    name: string,
    socketId: string,
  ): PublicRoomState & { hostSecret: string } {
    if (this.room.hostId && this.room.state === 'playing') {
      throw new BadRequestException('Room is already in use');
    }

    const now = new Date();
    const hostSecret = randomUUID();

    this.room = {
      id: ROOM_ID,
      hostId: socketId,
      hostName: name,
      hostSecret,
      players: [],
      drawnNumbers: [],
      state: 'waiting',
      createdAt: this.room.createdAt ?? now,
      updatedAt: now,
    };
    this.updateTimestamp();
    this.winnerId = undefined;

    return { ...this.getPublicRoomState(), hostSecret };
  }

  joinAsPlayer(
    name: string,
    socketId: string,
  ): {
    room: PublicRoomState;
    playerSecret: string;
    card: BingoCard;
    playerId: string;
  } {
    if (!this.room.hostId) {
      throw new BadRequestException('Room is not created yet');
    }
    if (this.room.state !== 'waiting') {
      throw new BadRequestException('Game already started');
    }

    const existing = this.room.players.find(
      (p) => p.socketId === socketId || p.name === name,
    );
    if (existing) {
      throw new BadRequestException('Player already joined');
    }

    const playerSecret = randomUUID();

    const player: Player = {
      id: randomUUID(),
      name,
      socketId,
      secret: playerSecret,
      card: this.cardService.generateCard(),
    };

    this.room.players.push(player);
    this.updateTimestamp();

    return {
      room: this.getPublicRoomState(),
      playerSecret,
      card: player.card,
      playerId: player.id,
    };
  }

  startGame(socketId: string): PublicRoomState {
    this.ensureHost(socketId);
    if (this.room.state !== 'waiting') {
      throw new BadRequestException('Game cannot be started now');
    }

    this.room.state = 'playing';
    this.room.drawnNumbers = [];
    this.winnerId = undefined;
    this.updateTimestamp();

    return this.getPublicRoomState();
  }

  restartGame(socketId: string): PublicRoomState {
    this.ensureHost(socketId);
    if (this.room.state !== 'finished') {
      throw new BadRequestException('Game is not finished');
    }

    // mismas personas, nuevas cartillas
    this.room.players = this.room.players.map((player) => ({
      ...player,
      card: this.cardService.generateCard(),
    }));
    this.room.state = 'waiting';
    this.room.drawnNumbers = [];
    this.winnerId = undefined;
    this.updateTimestamp();

    return this.getPublicRoomState();
  }

  endGame(socketId: string): PublicRoomState {
    this.ensureHost(socketId);
    const now = new Date();
    this.room = {
      id: ROOM_ID,
      hostId: null,
      hostName: null,
      hostSecret: null,
      players: [],
      drawnNumbers: [],
      state: 'waiting',
      createdAt: now,
      updatedAt: now,
    };
    this.winnerId = undefined;
    return this.getPublicRoomState();
  }

  drawNumber(socketId: string): { room: PublicRoomState; number: BingoNumber } {
    this.ensureHost(socketId);
    if (this.room.state !== 'playing') {
      throw new BadRequestException('Game is not in playing state');
    }

    const available = this.getAvailableNumbers();
    if (available.length === 0) {
      throw new BadRequestException('No more numbers available');
    }

    const idx = Math.floor(Math.random() * available.length);
    const value = available[idx];
    const bingoNumber = this.cardService.createBingoNumber(value);
    this.room.drawnNumbers.push(bingoNumber);
    this.updateTimestamp();

    return { room: this.getPublicRoomState(), number: bingoNumber };
  }

  claimBingo(
    socketId: string,
  ): { room: PublicRoomState; valid: boolean; playerId: string; playerName: string } {
    const player = this.getPlayerBySocket(socketId);
    if (!player) {
      throw new BadRequestException('Player not found');
    }
    if (this.room.state !== 'playing') {
      throw new BadRequestException('Game is not in playing state');
    }

    const valid = this.cardService.validateBingo(
      player.card,
      this.room.drawnNumbers,
    );

    if (valid) {
      this.room.state = 'finished';
      this.winnerId = player.id;
      this.updateTimestamp();
    }

    return {
      room: this.getPublicRoomState(),
      valid,
      playerId: player.id,
      playerName: player.name,
    };
  }

  leave(socketId: string): PublicRoomState {
    const player = this.getPlayerBySocket(socketId);
    if (player) {
      // Player disconnects: keep the player in memory so they can reclaim later
      this.updateTimestamp();
      return this.getPublicRoomState();
    }

    // Host disconnects: keep the room and players, just clear hostId
    if (this.room.hostId === socketId) {
      this.room.hostId = null;
      this.updateTimestamp();
    }

    return this.getPublicRoomState();
  }

  getRoomState(): PublicRoomState {
    return this.getPublicRoomState();
  }

  getCardForSocket(socketId: string): BingoCard | null {
    const player = this.getPlayerBySocket(socketId);
    return player?.card ?? null;
  }

  getPlayers(): Player[] {
    return [...this.room.players];
  }

  reclaimHost(hostSecret: string, socketId: string): PublicRoomState {
    if (!this.room.hostSecret || this.room.hostSecret !== hostSecret) {
      throw new BadRequestException('Invalid host token');
    }

    this.room.hostId = socketId;
    this.updateTimestamp();
    return this.getPublicRoomState();
  }

  reclaimPlayer(
    playerSecret: string,
    socketId: string,
  ): { room: PublicRoomState; card: BingoCard; playerId: string } {
    const player = this.room.players.find((p) => p.secret === playerSecret);
    if (!player) {
      throw new BadRequestException('Invalid player token');
    }

    player.socketId = socketId;
    this.updateTimestamp();

    return {
      room: this.getPublicRoomState(),
      card: player.card,
      playerId: player.id,
    };
  }

  markCell(
    socketId: string,
    row: number,
    col: number,
  ): { room: PublicRoomState; card: BingoCard } {
    const player = this.getPlayerBySocket(socketId);
    if (!player) {
      throw new BadRequestException('Player not found');
    }

    const { card } = player;
    if (
      row < 0 ||
      row >= card.marked.length ||
      col < 0 ||
      col >= card.marked[row].length
    ) {
      throw new BadRequestException('Invalid cell');
    }

    // no permitir desmarcar centro libre
    if (!(row === 2 && col === 2)) {
      card.marked[row][col] = !card.marked[row][col];
    }

    this.updateTimestamp();
    return {
      room: this.getPublicRoomState(),
      card,
    };
  }

  private getPlayerBySocket(socketId: string): Player | undefined {
    return this.room.players.find((p) => p.socketId === socketId);
  }

  private ensureHost(socketId: string) {
    if (this.room.hostId !== socketId) {
      throw new BadRequestException('Only host can perform this action');
    }
  }

  private getAvailableNumbers(): number[] {
    const drawnValues = new Set(this.room.drawnNumbers.map((n) => n.value));
    const available: number[] = [];
    for (let i = 1; i <= 75; i++) {
      if (!drawnValues.has(i)) {
        available.push(i);
      }
    }
    return available;
  }

  private getPublicRoomState(): PublicRoomState {
    return {
      id: this.room.id,
      hostName: this.room.hostName,
      players: this.room.players.map((p) => ({
        id: p.id,
        name: p.name,
      })),
      state: this.room.state,
      drawnNumbers: this.room.drawnNumbers,
      winnerId: this.winnerId,
    };
  }

  private updateTimestamp() {
    this.room.updatedAt = new Date();
  }
}
