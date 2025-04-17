import { Logger, Module } from '@nestjs/common';
import { CompetitionService } from './competitions.service';
import { CompetitionController } from './competitions.controller';
import { SlugHelper } from '@utils/generate-unique-slug.util';

import { ContentService } from '../contents/contents.service';
import { ConfigModule } from '@nestjs/config';
import { AudioPodcastService } from '../audio-podcasts/audio-podcasts.service';
import { VideoPodcastService } from '../video-podcasts/video-podcasts.service';
import { PrakerinService } from '../prakerin/prakerin.service';
import { SubmissionService } from './submission/submission.service';
import { SubmissionController } from './submission/submission.controller';
import { JudgeController } from './judge/judge.controller';
import { JudgeService } from './judge/judge.service';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [CompetitionController, SubmissionController, JudgeController],
  providers: [
    CompetitionService,
    SlugHelper,
    ContentService,
    AudioPodcastService,
    VideoPodcastService,
    PrakerinService,
    SubmissionService,
    JudgeService,
    FileUploadService,
    Logger,
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class CompetitionModule {}
