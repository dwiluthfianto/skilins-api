import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ContentDto {
  @ApiProperty({ example: 'Content Title', type: String })
  @IsNotEmpty()
  @MinLength(5)
  @IsString()
  title: string;

  @ApiProperty({ type: String, format: 'binary' })
  thumbnail: string;

  @ApiPropertyOptional({ example: 'This is a description', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['Fiction', 'Non Fiction'],
    type: String,
  })
  @IsOptional()
  @IsString()
  category_name: string;

  @ApiPropertyOptional({
    example: [
      {
        text: 'Mystery',
      },
    ],
    type: Object,
  })
  @IsOptional()
  genres: object[];

  @ApiPropertyOptional({
    example: [
      {
        text: 'Must Read',
      },
    ],
    type: Object,
  })
  @IsOptional()
  tags: object[];
}
