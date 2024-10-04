import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAudioPodcastDto } from './create-audio-podcast.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAudioPodcastDto extends PartialType(CreateAudioPodcastDto) {
  @ApiPropertyOptional({
    example: 2.3,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/video.mp4',
    type: String,
  })
  @IsOptional()
  @IsString()
  file_url?: string;

  @ApiPropertyOptional({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  @IsOptional()
  @IsString()
  creator_uuid?: string;
}
