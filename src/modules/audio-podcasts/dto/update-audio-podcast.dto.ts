import { PartialType } from '@nestjs/swagger';
import { CreateAudioPodcastDto } from './create-audio-podcast.dto';

export class UpdateAudioPodcastDto extends PartialType(CreateAudioPodcastDto) {}
