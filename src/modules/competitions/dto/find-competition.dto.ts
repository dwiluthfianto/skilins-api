import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindCompetitionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({
    enum: ['Video', 'Audio', 'Prakerin'],
    type: String,
    description: 'Search by type of competition',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Title of competition',
    description: 'Search by title of competition',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Search by the latest of content',
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
