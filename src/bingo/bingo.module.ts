import { Module } from '@nestjs/common';
import { BingoGateway } from './bingo.gateway';
import { BingoService } from './bingo.service';
import { CardService } from './card.service';
import { AlphabetPatternsService } from './alphabet-patterns.service';

@Module({
  providers: [
    BingoGateway,
    BingoService,
    CardService,
    AlphabetPatternsService,
  ],
})
export class BingoModule {}


