import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateGenreDto } from './create-genre.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGenreDto extends PartialType(CreateGenreDto) {
  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    type: String,
  })
  @IsOptional()
  avatar_url?: string;

  @ApiPropertyOptional({ example: 'this is a name', type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'this is a desc', type: String })
  @IsOptional()
  @IsString()
  description?: string;
}
