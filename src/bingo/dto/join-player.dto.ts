import { IsString, MinLength } from 'class-validator';

export class JoinPlayerDto {
  @IsString()
  @MinLength(1)
  name!: string;
}


