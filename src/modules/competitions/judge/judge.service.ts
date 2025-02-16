import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterJudgeDto } from '../dto/register-judge.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, RoleType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';
import { UpdateJudgeDto } from '../dto/update-judge.dto';
import { FindJudgeDto } from '../dto/find-judge.dto';

@Injectable()
export class JudgeService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllJudges(query: FindJudgeDto) {
    const { page, limit, name } = query;

    const filterName = {
      full_name: {
        contains: name,
        mode: Prisma.QueryMode.insensitive,
      },
    };
    const judge = await this.prismaService.user.findMany({
      where: {
        role: { name: RoleType.judge },
        ...filterName,
      },
      select: {
        uuid: true,
        profile: true,
        full_name: true,
        email: true,
        judge: {
          select: {
            role: true,
            linkedin: true,
            instagram: true,
            competition: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    const total = await this.prismaService.user.count({
      where: {
        role: { name: RoleType.judge },
        ...filterName,
      },
    });

    return {
      status: 'success',
      data: judge,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async regisNewJudge(registerJudgeDto: RegisterJudgeDto) {
    const hashedPassword = await bcrypt.hash(registerJudgeDto.password, 10);

    const res = await this.prismaService.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: registerJudgeDto.email,
          password: hashedPassword,
          email_verified: true,
          full_name: registerJudgeDto.full_name,
          role: { connect: { name: RoleType.judge } },
        },
      });

      const newJudge = await prisma.judge.create({
        data: {
          role: registerJudgeDto.role,
          linkedin: registerJudgeDto.linkedin,
          instagram: registerJudgeDto.instagram,
          user: { connect: { id: newUser.id } },
        },
      });

      return {
        status: 'success',
        message: 'judge added successfully!',
      };
    });

    return res;
  }

  async updateInfoJudge(judgeUuid: string, updateJudgeDto: UpdateJudgeDto) {
    const userJudge = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid: judgeUuid },
      select: {
        judge: {
          select: {
            uuid: true,
          },
        },
      },
    });

    const judge = await this.prismaService.user.update({
      where: {
        uuid: judgeUuid,
      },
      data: {
        full_name: updateJudgeDto.full_name,
        judge: {
          update: {
            where: {
              uuid: userJudge.judge.uuid,
            },
            data: {
              role: updateJudgeDto.role,
              linkedin: updateJudgeDto.linkedin,
              instagram: updateJudgeDto.instagram,
            },
          },
        },
      },
    });

    return {
      status: 'success',
      message: 'judge updated successfully!',
      data: {
        uuid: judge.uuid,
      },
    };
  }

  async removeJudge(judgeUuid: string) {
    const userJudge = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid: judgeUuid },
      select: {
        judge: {
          select: {
            uuid: true,
          },
        },
      },
    });

    await this.prismaService.user.update({
      where: { uuid: judgeUuid },
      data: {
        role: { connect: { name: RoleType.user } },
      },
    });

    await this.prismaService.judge.delete({
      where: { uuid: userJudge.judge.uuid },
    });

    return {
      status: 'success',
      message: 'judge deleted successfully',
    };
  }

  async findAllEvaluationParameter(competitionUuid: string) {
    const parameters = await this.prismaService.evaluationParameter.findMany({
      where: { competition: { uuid: competitionUuid } },
    });

    if (!parameters.length) {
      throw new NotFoundException(
        'No evaluation parameters found for this competition.',
      );
    }

    return {
      status: 'success',
      data: parameters,
    };
  }

  async evaluateSubmission(
    judgeUuid: string,
    evaluateSubmissionDto: EvaluateSubmissionDto,
  ) {
    const { submission_uuid, parameter_scores } = evaluateSubmissionDto;

    // Cari submission dan validasi kompetisi
    const res = await this.prismaService.$transaction(async (prisma) => {
      const submission = await prisma.submission.findUnique({
        where: { uuid: submission_uuid },
        include: { competition: { include: { evaluation_parameter: true } } },
      });

      if (!submission) {
        throw new NotFoundException(
          'Submission not found, please make sure you input correct submission',
        );
      }

      // Validasi bahwa juri adalah bagian dari kompetisi
      const judge = await prisma.judge.findFirst({
        where: {
          user: { uuid: judgeUuid },
          competition_id: submission.competition_id,
        },
      });

      if (!submission) {
        throw new ForbiddenException(
          'Judge not registered for this competition!',
        );
      }

      // Validasi parameter evaluasi
      const validParameters = submission.competition.evaluation_parameter.map(
        (p) => p.uuid,
      );
      for (const param of parameter_scores) {
        if (!validParameters.includes(param.parameter_uuid)) {
          throw new BadRequestException(
            `Invalid parameter UUID: ${param.parameter_uuid}`,
          );
        }
      }

      // Simpan setiap skor parameter ke database
      const scores = await Promise.all(
        parameter_scores.map(async (param) => {
          const evaluationParameter =
            await prisma.evaluationParameter.findUniqueOrThrow({
              where: { uuid: param.parameter_uuid },
            });

          return prisma.score.create({
            data: {
              judge_id: judge.id,
              submission_id: submission.id,
              parameter_id: evaluationParameter.id,
              score: param.score,
              notes: param.notes || null,
            },
          });
        }),
      );

      return {
        status: 'success',
        message: 'Submission evaluated successfully',
        data: scores,
      };
    });
  }

  async getScoredSubmission(competitionUuid: string) {
    const scored = await this.prismaService.submission.findMany({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'approved',
        },
        score: {
          some: {
            score: {
              not: 0,
            },
          },
        },
      },
      include: {
        student: true,
        content: true,
        competition: true,
      },
    });

    const summary = await this.summaryJudges(competitionUuid);

    return {
      status: 'success',
      data: scored,
      summary,
    };
  }

  async getUnscoredSubmission(competitionUuid: string) {
    const unscored = await this.prismaService.submission.findMany({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'approved',
        },
        score: {
          none: {
            score: {
              not: 0,
            },
          },
        },
      },
      include: {
        student: true,
        content: true,
        competition: true,
      },
    });

    const summary = await this.summaryJudges(competitionUuid);

    return {
      status: 'success',
      data: unscored,
      summary,
    };
  }

  async summaryJudges(competitionUuid: string) {
    const scoredSubmissions = await this.prismaService.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'approved',
        },
        score: {
          some: {
            score: {
              not: { equals: 0 },
            },
          },
        },
      },
    });

    const unscoredSubmissions = await this.prismaService.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'approved',
        },
        score: {
          none: {
            score: {
              not: { equals: 0 },
            },
          },
        },
      },
    });

    const totalSubmissions = await this.prismaService.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'approved',
        },
      },
    });

    const deadlineJudge = await this.prismaService.competition.findUnique({
      where: {
        uuid: competitionUuid,
      },
      select: {
        end_date: true,
      },
    });

    return {
      scoredSubmissions,
      unscoredSubmissions,
      totalSubmissions,
      deadlineJudge,
    };
  }

  async getJudge(userUuid: string) {
    const judge = await this.prismaService.user.findUnique({
      where: {
        uuid: userUuid,
      },
      include: {
        judge: {
          include: {
            competition: {
              select: {
                uuid: true,
              },
            },
          },
        },
      },
    });

    return {
      status: 'success',
      data: judge,
    };
  }
}
