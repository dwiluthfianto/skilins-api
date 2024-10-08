import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateNovelDto } from './create-novel.dto';
import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UpdateNovelDto extends PartialType(CreateNovelDto) {
  @ApiPropertyOptional({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  author_uuid: string;

  @ApiPropertyOptional({ example: 0, type: Number })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  pages: number;

  @ApiPropertyOptional({
    example: 'https://example.com/document.pdf',
    type: String,
  })
  file_url: string;
}
