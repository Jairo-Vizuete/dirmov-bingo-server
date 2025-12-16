import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingoModule } from './bingo/bingo.module';

@Module({
  imports: [BingoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
