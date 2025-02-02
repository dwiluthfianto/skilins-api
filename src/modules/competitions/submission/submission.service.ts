import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContentStatus, ContentType } from '@prisma/client';
import { ContentService } from 'src/modules/contents/contents.service';
import { MailerService } from '@nestjs-modules/mailer';
import { AudioPodcastService } from 'src/modules/audio-podcasts/audio-podcasts.service';
import { VideoPodcastService } from 'src/modules/video-podcasts/video-podcasts.service';
import { PrakerinService } from 'src/modules/prakerin/prakerin.service';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly contentService: ContentService,
    private readonly mailerService: MailerService,
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
    const res = await this.prismaService.$transaction(async (prisma) => {
      const competition =
        await this.prismaService.competition.findUniqueOrThrow({
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
      const userData = await prisma.user.findUniqueOrThrow({
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

      const submit = await prisma.submission.create({
        data: {
          student: { connect: { uuid: userData.student.uuid } },
          content: { connect: { uuid: content.data.uuid } },
          competition: { connect: { slug: competition_slug } },
        },
      });

      return {
        status: 'success',
        message: 'Successfully join the competition.',
        data: submit,
      };
    });

    return res;
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

    await this.mailerService.sendMail({
      to: submission.student.user.email,
      subject: 'Submission Approved',
      template: './submission-approved',
      context: {
        name: submission.student.name,
        competition_name: submission.competition.title,
        title_submission: submission.content.title,
        submission_id: submission.id,
        submission_date: submission.created_at,
        judging_dates: `${submission.competition.start_date} - ${submission.competition.end_date}`,
        announcement_date: submission.competition.end_date,
      },
    });

    this.logger.log(
      `Approved Submission email sent to ${submission.student.name}`,
    );
    return this.contentService.updateContentStatus(
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

    await this.mailerService.sendMail({
      to: submission.student.user.email,
      subject: `Submission Rejected`,
      template: './submission-rejected',
      context: {
        name: submission.student.name,
        competition_name: submission.competition.title,
        title_submission: submission.content.title,
        submission_id: submission.id,
        submission_date: submission.created_at,
      },
    });

    this.logger.log(`Approved Submission sent to ${submission.student.name}`);
    return this.contentService.updateContentStatus(
      submission.content.uuid,
      ContentStatus.rejected,
    );
  }
}
