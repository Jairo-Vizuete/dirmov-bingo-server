import { Module } from '@nestjs/common';
import { BingoGateway } from './bingo.gateway';
import { BingoService } from './bingo.service';
import { CardService } from './card.service';

@Module({
  providers: [BingoGateway, BingoService, CardService],
})
export class BingoModule {}


