import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BingoCard, BingoLetter, BingoNumber } from './types/bingo.types';
import { AlphabetPatternsService } from './alphabet-patterns.service';

@Injectable()
export class CardService {
  constructor(
    private readonly alphabetPatternsService: AlphabetPatternsService,
  ) {}
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

  validateBingo(
    card: BingoCard,
    drawnNumbers: BingoNumber[],
    selectedLetter: string,
  ): boolean {
    // Validación estricta: solo se puede ganar con el patrón completo de la letra
    if (!selectedLetter || selectedLetter.trim() === '') {
      return false;
    }

    try {
      const pattern = this.alphabetPatternsService.getPattern(selectedLetter);
      const drawnSet = new Set<number>(
        drawnNumbers.map((n) => this.fromLetterValueToRaw(n)),
      );

      // Contar cuántas celdas del patrón deben estar marcadas
      let requiredCells = 0;
      let markedCells = 0;

      // Validar que todas las celdas del patrón estén marcadas
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          // Si el patrón requiere que esta celda esté marcada
          if (pattern[row][col]) {
            requiredCells++;

            // Centro libre siempre cuenta si está marcado
            if (row === 2 && col === 2) {
              if (card.marked[row][col]) {
                markedCells++;
              } else {
                return false; // Centro libre debe estar marcado si el patrón lo requiere
              }
              continue;
            }

            // Verificar que la celda esté marcada
            if (!card.marked[row][col]) {
              return false; // Celda del patrón no está marcada
            }

            markedCells++;

            // Verificar que el número en esa celda esté en los números dibujados
            const value = card.numbers[row][col];
            if (value !== null && !drawnSet.has(value)) {
              return false; // El número de esta celda no fue dibujado
            }
          }
        }
      }

      // Validación final: todas las celdas requeridas deben estar marcadas
      return requiredCells > 0 && markedCells === requiredCells;
    } catch (error) {
      // Si hay error obteniendo el patrón, no se puede validar
      return false;
    }
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

  private getLetterForValue(value: number): BingoLetter {
    if (value >= 1 && value <= 15) return 'B';
    if (value >= 16 && value <= 30) return 'I';
    if (value >= 31 && value <= 45) return 'N';
    if (value >= 46 && value <= 60) return 'G';
    return 'O';
  }
}


