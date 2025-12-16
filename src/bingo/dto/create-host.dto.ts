import { IsString, MinLength } from 'class-validator';

export class CreateHostDto {
  @IsString()
  @MinLength(1)
  name!: string;
}


