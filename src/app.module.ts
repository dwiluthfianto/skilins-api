import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { EbookModule } from './modules/ebooks/ebooks.module';
import { CategoryModule } from './modules/categories/categories.module';
import { AudioPodcastModule } from './modules/audio-podcasts/audio-podcasts.module';
import { VideoPodcastModule } from './modules/video-podcasts/video-podcasts.module';
import { BlogModule } from './modules/blogs/blogs.module';
import { StudentModule } from './modules/students/students.module';
import { MajorModule } from './modules/majors/majors.module';
import { CommentModule } from './modules/comments/comments.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { ThrottlerModule } from '@nestjs/throttler';
import { MailerConfigModule } from './modules/mailer/mailer.module';
import { HealthModule } from './modules/health/health.module';
import { GenreModule } from './modules/genres/genres.module';
import { RatingModule } from './modules/ratings/ratings.module';
import { ContentModule } from './modules/contents/contents.module';
import { CompetitionModule } from './modules/competitions/competitions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TagModule } from './modules/tags/tags.module';
import { PrakerinModule } from './modules/prakerin/prakerin.module';
import { StoryModule } from './modules/stories/stories.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/wingston.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Folder "uploads" sebagai root file statis
      serveRoot: '/public', // URL akses publik, contoh: http://localhost:3000/uploads/
    }),
    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    EbookModule,
    CategoryModule,
    AudioPodcastModule,
    VideoPodcastModule,
    BlogModule,
    StudentModule,
    MajorModule,
    CommentModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot(),
    PassportModule,
    AnalyticsModule,
    // ThrottlerModule.forRoot([
    //   {
    //     ttl: 60000,
    //     limit: 10,
    //   },
    // ]),
    ScheduleModule.forRoot(),
    MailerConfigModule,
    HealthModule,
    GenreModule,
    RatingModule,
    ContentModule,
    CompetitionModule,
    TagModule,
    PrakerinModule,
    StoryModule,
    FileUploadModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
