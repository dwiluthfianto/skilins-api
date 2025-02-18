import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContentStatus, ContentType } from '@prisma/client';
import { ContentService } from 'src/modules/contents/contents.service';
import { AudioPodcastService } from 'src/modules/audio-podcasts/audio-podcasts.service';
import { VideoPodcastService } from 'src/modules/video-podcasts/video-podcasts.service';
import { PrakerinService } from 'src/modules/prakerin/prakerin.service';
import { EmailService } from '@modules/mailer/mailer.service';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly contentService: ContentService,
    private readonly emailService: EmailService,
    private readonly audioPodcastService: AudioPodcastService,
    private readonly videoPodcastService: VideoPodcastService,
    private readonly prakerinService: PrakerinService,
  ) {}
  async submitToCompetition(
    userUuid: string,
    createSubmissionDto: CreateSubmissionDto,
  ) {
    const { competition_slug, type, audioData, videoData, prakerinData } =
      createSubmissionDto;
    const competition = await this.prismaService.competition.findUnique({
      where: { slug: competition_slug },
    });

    if (new Date() > competition.submission_deadline) {
      throw new BadRequestException('Submission deadline has passed.');
    }

    let content;

    if (type === ContentType.audio && audioData) {
      content = await this.audioPodcastService.createAudioPodcast(
        userUuid,
        audioData,
      );
    }
    if (type === ContentType.video && videoData) {
      content = await this.videoPodcastService.create(userUuid, videoData);
    }
    if (type === ContentType.prakerin && prakerinData) {
      content = await this.prakerinService.createPrakerin(
        userUuid,
        prakerinData,
      );
    }

    if (!content || competition.type !== content.data.type) {
      throw new BadRequestException(
        'Content category does not match competition category.',
      );
    }
    const userData = await this.prismaService.user.findUniqueOrThrow({
      where: {
        uuid: userUuid,
      },
      include: {
        student: {
          select: {
            uuid: true,
          },
        },
      },
    });

    await this.prismaService.submission.create({
      data: {
        student: { connect: { uuid: userData.student.uuid } },
        content: { connect: { uuid: content.data.uuid } },
        competition: { connect: { slug: competition_slug } },
      },
    });
  }

  async approveSubmission(submissionUuid: string) {
    const submission = await this.prismaService.submission.findUniqueOrThrow({
      where: { uuid: submissionUuid },
      include: {
        content: true,
        competition: true,
        student: { include: { user: { select: { email: true } } } },
      },
    });

    await this.emailService.sendSubmissionApprovedEmail(
      submission.student.user.email,
      submission.student.name,
      submission.competition.title,
      submission.content.title,
      submission.id.toString(),
      submission.created_at.toISOString(),
      `${submission.competition.start_date} - ${submission.competition.end_date}`,
      submission.competition.end_date.toISOString(),
    );

    await this.contentService.updateContentStatus(
      submission.content.uuid,
      ContentStatus.approved,
    );
  }

  async rejectSubmission(submissionUuid: string) {
    const submission = await this.prismaService.submission.findUniqueOrThrow({
      where: { uuid: submissionUuid },
      include: {
        competition: true,
        content: true,
        student: { include: { user: { select: { email: true } } } },
      },
    });

    await this.emailService.sendSubmissionRejectedEmail(
      submission.student.user.email,
      submission.student.name,
      submission.competition.title,
      submission.content.title,
      submission.id.toString(),
      submission.created_at.toISOString(),
    );

    await this.contentService.updateContentStatus(
      submission.content.uuid,
      ContentStatus.rejected,
    );
  }
}
