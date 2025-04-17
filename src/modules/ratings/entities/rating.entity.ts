import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class Rating {
  @ApiProperty()
  @IsString()
  rating_by: string;

  @ApiProperty({ example: 5, type: Number })
  @IsInt()
  rating_value: number;
}
