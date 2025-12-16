import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AlphabetPatternsService {
  private readonly patterns: Record<string, boolean[][]> = {
    A: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
    ],
    B: [
      [true, true, true, true, false],
      [true, false, false, false, true],
      [true, true, true, true, false],
      [true, false, false, false, true],
      [true, true, true, true, false],
    ],
    C: [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
    D: [
      [true, true, true, true, false],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, false],
    ],
    E: [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
    F: [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, false, false, false],
    ],
    G: [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    H: [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
    ],
    I: [
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [true, true, true, true, true],
    ],
    J: [
      [false, false, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    K: [
      [true, false, false, false, true],
      [true, false, false, true, false],
      [true, true, true, false, false],
      [true, false, false, true, false],
      [true, false, false, false, true],
    ],
    L: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
    M: [
      [true, false, false, false, true],
      [true, true, false, true, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
    ],
    N: [
      [true, false, false, false, true],
      [true, true, false, false, true],
      [true, false, true, false, true],
      [true, false, false, true, true],
      [true, false, false, false, true],
    ],
    O: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    P: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, false, false, false],
    ],
    Q: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, true, false],
      [true, true, true, true, false],
    ],
    R: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, true, false],
      [true, false, false, false, true],
    ],
    S: [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, true, true, true, true],
      [false, false, false, false, true],
      [true, true, true, true, true],
    ],
    T: [
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ],
    U: [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    V: [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
    ],
    W: [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, true, false, true],
      [false, true, true, true, false],
      [true, false, false, false, true],
    ],
    X: [
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, false, false, true],
    ],
    Y: [
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ],
    Z: [
      [true, true, true, true, true],
      [false, false, false, true, false],
      [false, false, true, false, false],
      [false, true, false, false, false],
      [true, true, true, true, true],
    ],
  };

  getPattern(letter: string): boolean[][] {
    const upperLetter = letter.toUpperCase();
    if (!this.patterns[upperLetter]) {
      throw new BadRequestException(
        `Invalid letter: ${letter}. Must be A-Z`,
      );
    }
    return this.patterns[upperLetter];
  }

  isValidLetter(letter: string): boolean {
    return letter.toUpperCase() in this.patterns;
  }
}

