import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContentStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindContentQueryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({
    enum: ['Fiction', 'Non Fiction'],
    type: String,
    description: 'Search by category of content',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Popular Choice',
    description: 'Search by tag of content',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Romance',
    description: 'Search by genre of content',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Title of content',
    description: 'Search by title of content',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
  latest?: boolean;

  @ApiPropertyOptional({
    type: ContentStatus,
    enum: ContentStatus,
    enumName: 'Status approval content',
    description: 'Search by status approval of content',
  })
  @IsOptional()
  @IsString()
  status?: ContentStatus;
}
