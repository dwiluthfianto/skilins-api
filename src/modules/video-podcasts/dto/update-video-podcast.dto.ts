import { PartialType } from '@nestjs/swagger';
import { CreateVideoPodcastDto } from './create-video-podcast.dto';

export class UpdateVideoPodcastDto extends PartialType(CreateVideoPodcastDto) {}
