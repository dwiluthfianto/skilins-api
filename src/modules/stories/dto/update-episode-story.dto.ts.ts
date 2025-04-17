import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { AddStoryEpisodeDto } from './add-episode-story.dto.ts';

export class UpdateStoryEpisodeDto extends PartialType(AddStoryEpisodeDto) {
  @ApiPropertyOptional({
    example: 'episode 2: the network',
    type: String,
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: ' Actual text or description of the episode',
    type: String,
  })
  @IsOptional()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  order: number;
}
