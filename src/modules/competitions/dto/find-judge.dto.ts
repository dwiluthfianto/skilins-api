import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindJudgeDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Name of judges',
    description: 'Search by name of judges',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
