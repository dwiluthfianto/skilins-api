import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGenreDto {
  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  avatar?: string;

  @ApiProperty({ example: 'this is a name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'this is a desc', type: String })
  @IsOptional()
  @IsString()
  description?: string;
}
