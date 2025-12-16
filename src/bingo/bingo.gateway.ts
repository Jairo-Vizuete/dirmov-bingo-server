import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BadRequestException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BingoService } from './bingo.service';
import { CreateHostDto } from './dto/create-host.dto';
import { JoinPlayerDto } from './dto/join-player.dto';
import { ClaimBingoDto } from './dto/claim-bingo.dto';
import { MarkCellDto } from './dto/mark-cell.dto';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class BingoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(BingoGateway.name);

  constructor(private readonly bingoService: BingoService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('roomState', this.bingoService.getRoomState());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const roomState = this.bingoService.leave(client.id);
    this.server.emit('roomState', roomState);
  }

  @SubscribeMessage('createHost')
  handleCreateHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: CreateHostDto,
  ) {
    try {
      const result = this.bingoService.createHost(body.name, client.id);
      const { hostSecret, ...room } = result;
      client.emit('hostCreated', { room, hostSecret });
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('joinAsPlayer')
  handleJoinAsPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPlayerDto,
  ) {
    try {
      const result = this.bingoService.joinAsPlayer(body.name, client.id);
      this.server.emit('roomState', result.room);
      client.emit('playerJoined', {
        room: result.room,
        playerSecret: result.playerSecret,
        playerId: result.playerId,
      });
      client.emit('myCard', result.card);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(@ConnectedSocket() client: Socket) {
    try {
      const room = this.bingoService.startGame(client.id);
      this.server.emit('gameStarted', room);
      const players = this.bingoService.getPlayers();
      players.forEach((player) => {
        const card = this.bingoService.getCardForSocket(player.socketId);
        if (card) {
          this.server.to(player.socketId).emit('myCard', card);
        }
      });
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('drawNumber')
  handleDrawNumber(@ConnectedSocket() client: Socket) {
    try {
      const { room, number } = this.bingoService.drawNumber(client.id);
      this.server.emit('numberDrawn', number);
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('restartGame')
  handleRestartGame(@ConnectedSocket() client: Socket) {
    try {
      const room = this.bingoService.restartGame(client.id);
      this.server.emit('gameRestarted', room);
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('endGame')
  handleEndGame(@ConnectedSocket() client: Socket) {
    try {
      const room = this.bingoService.endGame(client.id);
      this.server.emit('gameEnded', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('claimBingo')
  handleClaimBingo(
    @ConnectedSocket() client: Socket,
    @MessageBody() _body: ClaimBingoDto,
  ) {
    try {
      const { room, valid, playerId, playerName } =
        this.bingoService.claimBingo(client.id);

      // Evento general de intento de bingo (puede usarse en el futuro)
      this.server.emit('bingoClaimed', {
        playerSocketId: client.id,
        playerId,
        playerName,
        valid,
      });

      // Evento principal consumido por los clientes
      this.server.emit('bingoResult', {
        valid,
        winnerId: room.winnerId,
        playerId,
        playerName,
      });
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('markCell')
  handleMarkCell(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: MarkCellDto,
  ) {
    try {
      const result = this.bingoService.markCell(client.id, body.row, body.col);
      client.emit('myCard', result.card);
      this.server.emit('roomState', result.room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('reclaimHost')
  handleReclaimHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { hostSecret: string },
  ) {
    try {
      const room = this.bingoService.reclaimHost(body.hostSecret, client.id);
      client.emit('hostReclaimed', room);
      this.server.emit('roomState', room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('reclaimPlayer')
  handleReclaimPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { playerSecret: string },
  ) {
    try {
      const result = this.bingoService.reclaimPlayer(
        body.playerSecret,
        client.id,
      );
      client.emit('playerReclaimed', {
        room: result.room,
        playerId: result.playerId,
      });
      client.emit('myCard', result.card);
      this.server.emit('roomState', result.room);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    const room = this.bingoService.leave(client.id);
    this.server.emit('roomState', room);
  }

  private handleError(client: Socket, error: unknown) {
    let message = 'Unknown error';
    if (error instanceof BadRequestException) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    this.logger.error(message);
    client.emit('error', { message });
  }
}


