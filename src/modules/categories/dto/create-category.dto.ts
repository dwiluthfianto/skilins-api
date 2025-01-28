import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fiction', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    format: 'binary',
  })
  avatar: string;

  @ApiPropertyOptional({ example: 'This is a description', type: String })
  @IsString()
  @IsOptional()
  description?: string;
}
