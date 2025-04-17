import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ example: 5, type: Number })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @Type(() => Number)
  rating_value: number;
}
