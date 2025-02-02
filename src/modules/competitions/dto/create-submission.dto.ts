import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { CreateAudioPodcastDto } from 'src/modules/audio-podcasts/dto/create-audio-podcast.dto';
import { CreatePrakerinDto } from 'src/modules/prakerin/dto/create-prakerin.dto';
import { CreateVideoPodcastDto } from 'src/modules/video-podcasts/dto/create-video-podcast.dto';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'slug competition', type: String })
  @IsNotEmpty()
  @IsString()
  competition_slug: string;

  @ApiProperty({ example: 'Audio', enum: ContentType })
  @IsNotEmpty()
  @IsEnum(ContentType)
  type: ContentType;

  @ValidateIf((o) => o.type === ContentType.audio)
  @Type(() => CreateAudioPodcastDto)
  audioData?: CreateAudioPodcastDto;

  @ValidateIf((o) => o.type === ContentType.video)
  @Type(() => CreateVideoPodcastDto)
  videoData?: CreateVideoPodcastDto;

  @ValidateIf((o) => o.type === ContentType.prakerin)
  @Type(() => CreatePrakerinDto)
  prakerinData?: CreatePrakerinDto;
}
