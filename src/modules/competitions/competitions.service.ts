import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';

import { SlugHelper } from '@utils/generate-unique-slug.util';
import parseArrayInput from '@utils/parse-array.util';
import { ContentStatus, ContentType } from '@prisma/client';
import { FindCompetitionDto } from './dto/find-competition.dto';
import competitionFilter from '@utils/competition-filter.util';

@Injectable()
export class CompetitionService {
  constructor(
    private prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
  ) {}

  async createCompetition(data: CreateCompetitionDto) {
    await this.prismaService.$transaction(async (prisma) => {
      const newSlug = await this.slugHelper.generateUniqueSlugCompe(data.title);

      const judge_uuids = parseArrayInput(data.judge_uuids);

      const competition = await prisma.competition.create({
        data: {
          thumbnail: data.thumbnail,
          title: data.title,
          slug: newSlug,
          type: data.type as ContentType,
          description: data.description,
          guide: data.guide,
          start_date: data.start_date,
          end_date: data.end_date,
          winner_count: data.winner_count,
          submission_deadline: data.submission_deadline,
        },
      });

      const parameters = parseArrayInput(data.parameters);

      if (parameters && parameters.length > 0) {
        parameters.map(async (param) => {
          await prisma.evaluationParameter.create({
            data: {
              competition_id: competition.id,
              parameter_name: param.parameterName,
              weight: parseInt(param.weight, 10),
            },
          });
        });
      }

      if (judge_uuids && judge_uuids.length > 0) {
        for (const judge_uuid of judge_uuids) {
          const user = await prisma.user.findUniqueOrThrow({
            where: { uuid: judge_uuid.id },
            select: { judge: { select: { uuid: true } } },
          });

          await prisma.judge.update({
            where: { uuid: user.judge.uuid },
            data: {
              competition_id: competition.id,
            },
          });
        }
      }
    });
  }

  async updateCompetition(uuid: string, data: UpdateCompetitionDto) {
    await this.prismaService.$transaction(async (prisma) => {
      const newSlug = await this.slugHelper.generateUniqueSlug(data.title);
      const judge_uuids = parseArrayInput(data.judge_uuids);
      const competition = await prisma.competition.update({
        where: { uuid },
        data: {
          thumbnail: data.thumbnail,
          title: data.title,
          slug: newSlug,
          type: data.type as ContentType,
          description: data.description,
          guide: data.guide,
          start_date: data.start_date,
          end_date: data.end_date,
          winner_count: data.winner_count,
          submission_deadline: data.submission_deadline,
        },
      });

      const parameters = parseArrayInput(data.parameters);

      if (parameters && parameters.length > 0) {
        await prisma.evaluationParameter.deleteMany({
          where: { competition_id: competition.id },
        });

        for (const param of parameters) {
          await prisma.evaluationParameter.create({
            data: {
              competition_id: competition.id,
              parameter_name: param.parameterName,
              weight: parseInt(param.weight, 10),
            },
          });
        }
      } else {
        await prisma.evaluationParameter.deleteMany({
          where: { competition_id: competition.id },
        });
      }

      if (judge_uuids && judge_uuids.length > 0) {
        for (const judge_uuid of judge_uuids) {
          const user = await prisma.user.findUnique({
            where: { uuid: judge_uuid.id },
            select: { judge: { select: { uuid: true } } },
          });

          if (!user) {
            throw new NotFoundException(
              'Judge not found, please make sure you input correct judge',
            );
          }

          await prisma.judge.update({
            where: { uuid: user.judge.uuid },
            data: {
              competition_id: competition.id,
            },
          });
        }
      }
    });
  }

  async findAllCompetition(query: FindCompetitionDto) {
    const { page, limit, type, title } = query;

    const filter = competitionFilter({ type, title });

    const competition = await this.prismaService.competition.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        ...filter,
      },
    });

    const total = await this.prismaService.competition.count({
      where: { ...filter },
    });

    return {
      data: competition,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findCompetitionByUuid(competitionUuid: string) {
    const competition = await this.prismaService.competition.findUnique({
      where: { uuid: competitionUuid },
    });

    if (!competition) {
      throw new NotFoundException(
        'Competition not found, please make sure you input correct competition',
      );
    }
    return competition;
  }

  async getCompetitionDetail(
    slug: string,
    type: string,
    status: string = ContentStatus.approved,
  ) {
    const competition = await this.prismaService.competition.findUnique({
      where: { slug, type: type as ContentType },
      include: {
        submission: {
          where: {
            content: {
              status: status as ContentStatus,
            },
          },
          select: {
            uuid: true,
            content: {
              select: {
                uuid: true,
                type: true,
                title: true,
                thumbnail: true,
                slug: true,
                status: true,
              },
            },
          },
        },
        judge: {
          select: {
            uuid: true,
            user: {
              select: {
                profile: true,
                full_name: true,
              },
            },
            role: true,
            linkedin: true,
            instagram: true,
          },
        },
        winner: {
          include: {
            submission: {
              select: {
                uuid: true,
                content: {
                  select: {
                    title: true,
                    slug: true,
                    thumbnail: true,
                  },
                },
                student: {
                  select: {
                    name: true,
                    major: true,
                  },
                },
                score: true,
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new NotFoundException(
        'Competition not found, please make sure you input correct competition',
      );
    }

    const winnersWithScore = await Promise.all(
      competition.winner.map(async (winner) => ({
        ...winner,
        submission: {
          ...winner.submission,
          final_score: await this.calculateFinalScore(winner.submission.uuid),
        },
      })),
    );

    return {
      ...competition,
      winner: winnersWithScore,
    };
  }

  async getCompetitionBySlug(slug: string) {
    const competition = await this.prismaService.competition.findUniqueOrThrow({
      where: { slug },
      include: {
        evaluation_parameter: true,
        judge: {
          include: {
            user: {
              select: {
                uuid: true,
                profile: true,
                full_name: true,
              },
            },
          },
        },
      },
    });

    return {
      ...competition,
      judge: competition.judge.map((item) => ({
        id: item.user.uuid,
        text: item.user.full_name,
      })),
      evaluation_parameter: competition.evaluation_parameter.map((item) => ({
        parameterName: item.parameter_name,
        weight: item.weight,
      })),
    };
  }

  async getCompetitionByUuid(uuid: string) {
    const competition = await this.prismaService.competition.findUnique({
      where: { uuid },
      include: {
        submission: {
          include: { student: true, content: true },
        },
        judge: true,
        winner: true,
      },
    });

    if (!competition) {
      throw new NotFoundException(
        'Competition not found, please make sure you input correct competition',
      );
    }

    return competition;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async determineWinnersForEndedCompetitions() {
    const today = new Date();

    const endedCompetitions = await this.prismaService.competition.findMany({
      where: {
        end_date: { lte: today },
        winner: { none: {} },
      },
      include: { submission: { include: { judge: true } } },
    });

    await this.prismaService.$transaction(async (prisma) => {
      for (const competition of endedCompetitions) {
        const winnerCount = competition.winner_count;

        const topSubmissions = await this.getTopSubmissions(
          competition.submission,
          winnerCount,
        );

        for (let i = 0; i < topSubmissions.length; i++) {
          await prisma.winner.create({
            data: {
              competition_id: competition.id,
              submission_id: topSubmissions[i].id,
              rank: i + 1,
            },
          });
        }
      }
    });
  }

  async getTopSubmissions(submissions, winnerCount: number) {
    const scoredSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const finalScore = await this.calculateFinalScore(submission.uuid);
        return { ...submission, finalScore };
      }),
    );

    return scoredSubmissions
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, winnerCount);
  }

  async calculateFinalScore(uuid: string): Promise<number> {
    const submission = await this.prismaService.submission.findUniqueOrThrow({
      where: { uuid },
      include: {
        content: {
          select: {
            uuid: true,
          },
        },
        score: {
          select: {
            parameter: {
              select: {
                parameter_name: true,
                weight: true,
                scores: {
                  select: {
                    score: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalWeightedScore = 0;
    let totalWeight = 0;

    submission.score.forEach((index) => {
      const scores = index.parameter.scores.map((s) => s.score);
      const averageParameterScore = scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      totalWeightedScore +=
        averageParameterScore * (index.parameter.weight / 100);
      totalWeight += index.parameter.weight;
    });

    const normalizedScore =
      totalWeight > 0 ? totalWeightedScore / (totalWeight / 100) : 0;

    const averageUserRating = await this.prismaService.rating.aggregate({
      where: { content: { uuid: submission.content.uuid } },
      _avg: {
        rating_value: true,
      },
    });

    const userRatingScore = averageUserRating._avg.rating_value ?? 0;

    const final_score = 0.2 * userRatingScore + 0.8 * normalizedScore;

    return final_score;
  }

  async getWinnersForCompetition(uuid: string) {
    const competition = await this.prismaService.competition.findUnique({
      where: { uuid },
    });

    if (!competition) {
      throw new NotFoundException(
        'Competition not found, please make sure you input correct competition',
      );
    }
    return this.prismaService.winner.findMany({
      where: { competition_id: competition.id },
      include: { submission: true },
      orderBy: { rank: 'asc' },
    });
  }

  async removeCompetition(competitionUuid: string) {
    const competition = await this.prismaService.competition.findUnique({
      where: { uuid: competitionUuid },
    });

    if (!competition) {
      throw new NotFoundException(
        'Competition not found, please make sure you input correct competition',
      );
    }

    await this.prismaService.competition.delete({
      where: { uuid: competitionUuid },
    });
  }
}
