import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BingoCard, BingoLetter, BingoNumber } from './types/bingo.types';

@Injectable()
export class CardService {
  generateCard(): BingoCard {
    const columns: Record<BingoLetter, number[]> = {
      B: this.generateUniqueNumbers(1, 15, 5),
      I: this.generateUniqueNumbers(16, 30, 5),
      N: this.generateUniqueNumbers(31, 45, 5),
      G: this.generateUniqueNumbers(46, 60, 5),
      O: this.generateUniqueNumbers(61, 75, 5),
    };

    const numbers: (number | null)[][] = Array.from({ length: 5 }, () =>
      Array<number | null>(5).fill(null),
    );

    const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        numbers[row][col] = columns[letters[col]][row];
      }
    }

    // centro libre
    numbers[2][2] = null;

    const marked: boolean[][] = Array.from({ length: 5 }, () =>
      Array<boolean>(5).fill(false),
    );
    marked[2][2] = true;

    return {
      id: randomUUID(),
      numbers,
      marked,
    };
  }

  validateBingo(card: BingoCard, drawnNumbers: BingoNumber[]): boolean {
    const drawnSet = new Set<number>(
      drawnNumbers.map((n) => this.fromLetterValueToRaw(n)),
    );

    // horizontal
    for (let row = 0; row < 5; row++) {
      if (this.isFullLine(card, drawnSet, row, 'row')) return true;
    }

    // vertical
    for (let col = 0; col < 5; col++) {
      if (this.isFullLine(card, drawnSet, col, 'col')) return true;
    }

    // diagonales
    if (this.isDiagonalBingo(card, drawnSet)) return true;

    return false;
  }

  createBingoNumber(
    value: number,
    drawnAt: Date = new Date(),
  ): BingoNumber {
    const letter = this.getLetterForValue(value);
    return { letter, value, drawnAt };
  }

  private generateUniqueNumbers(
    min: number,
    max: number,
    count: number,
  ): number[] {
    const pool: number[] = [];
    for (let i = min; i <= max; i++) {
      pool.push(i);
    }
    const result: number[] = [];
    while (result.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const [num] = pool.splice(idx, 1);
      result.push(num);
    }
    return result;
  }

  private fromLetterValueToRaw(num: BingoNumber): number {
    return num.value;
  }

  private isFullLine(
    card: BingoCard,
    drawnSet: Set<number>,
    index: number,
    axis: 'row' | 'col',
  ): boolean {
    for (let i = 0; i < 5; i++) {
      const row = axis === 'row' ? index : i;
      const col = axis === 'col' ? index : i;
      const value = card.numbers[row][col];

      if (row === 2 && col === 2) continue; // centro libre

      if (value == null || !drawnSet.has(value)) {
        return false;
      }
    }
    return true;
  }

  private isDiagonalBingo(card: BingoCard, drawnSet: Set<number>): boolean {
    // principal
    let diag1 = true;
    for (let i = 0; i < 5; i++) {
      if (i === 2) continue;
      const value = card.numbers[i][i];
      if (value == null || !drawnSet.has(value)) {
        diag1 = false;
        break;
      }
    }

    // secundaria
    let diag2 = true;
    for (let i = 0; i < 5; i++) {
      if (i === 2) continue;
      const value = card.numbers[i][4 - i];
      if (value == null || !drawnSet.has(value)) {
        diag2 = false;
        break;
      }
    }

    return diag1 || diag2;
  }

  private getLetterForValue(value: number): BingoLetter {
    if (value >= 1 && value <= 15) return 'B';
    if (value >= 16 && value <= 30) return 'I';
    if (value >= 31 && value <= 45) return 'N';
    if (value >= 46 && value <= 60) return 'G';
    return 'O';
  }
}


