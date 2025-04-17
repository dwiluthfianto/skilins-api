import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContentDto } from 'src/modules/contents/dto/content.dto';

export class CreateEbookDto extends ContentDto {
  @ApiProperty({ example: 'J.K Rowling', type: String })
  @IsNotEmpty()
  @IsString()
  author: string;

  @ApiPropertyOptional({ example: 0, type: Number })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  pages: number;

  @ApiPropertyOptional({ example: 'This is a Publication', type: String })
  @IsString()
  @IsOptional()
  publication?: string;

  @ApiProperty({ type: String, format: 'binary' })
  file: string;

  @ApiPropertyOptional({ example: 'This is an ISBN', type: String })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: '2024-04-30', type: Date })
  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  release_date: Date;
}
