import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterJudgeDto } from '../dto/register-judge.dto';
import * as bcrypt from 'bcrypt';
import { RoleType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';
import { UpdateJudgeDto } from '../dto/update-judge.dto';

@Injectable()
export class JudgeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllJudges(page?: number, limit?: number, search: string = '') {
    const judge = await this.prisma.user.findMany({
      where: {
        role: { name: RoleType.Judge },
        full_name: {
          contains: search,
          mode: 'insensitive',
        },
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

    const total = await this.prisma.user.count({
      where: {
        role: { name: RoleType.Judge },
        full_name: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    return {
      status: 'success',
      data: judge.map((judge) => {
        const judgeData = judge.judge?.[0];
        return {
          uuid: judge.uuid,
          profile: judge.profile,
          full_name: judge.full_name,
          email: judge.email,
          role: judgeData.role,
          linkedin: judgeData.linkedin,
          instagram: judgeData.instagram,
          competition: judgeData.competition?.title,
        };
      }),
      totalPages: limit ? Math.ceil(total / limit) : 1,
      page: page || 1,
      lastPage: limit ? Math.ceil(total / limit) : 1,
    };
  }

  async regisNewJudge(registerJudgeDto: RegisterJudgeDto) {
    const hashedPassword = await bcrypt.hash(registerJudgeDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: registerJudgeDto.email,
        password: hashedPassword,
        email_verified: true,
        full_name: registerJudgeDto.full_name,
        role: { connect: { name: RoleType.Judge } },
      },
    });

    const newJudge = await this.prisma.judge.create({
      data: {
        role: registerJudgeDto.role,
        linkedin: registerJudgeDto.linkedin,
        instagram: registerJudgeDto.instagram,
        user: { connect: { id: newUser.id } },
      },
    });

    return {
      status: 'success',
      message: 'Judge added successfully!',
      data: {
        uuid: newJudge.uuid,
      },
    };
  }

  async updateInfoJudge(judgeUuid: string, updateJudgeDto: UpdateJudgeDto) {
    const userJudge = await this.prisma.user.findUniqueOrThrow({
      where: { uuid: judgeUuid },
      select: {
        judge: {
          select: {
            uuid: true,
          },
        },
      },
    });

    const judge = await this.prisma.user.update({
      where: {
        uuid: judgeUuid,
      },
      data: {
        full_name: updateJudgeDto.full_name,
        judge: {
          update: {
            where: {
              uuid: userJudge.judge[0].uuid,
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
      message: 'Judge updated successfully!',
      data: {
        uuid: judge.uuid,
      },
    };
  }

  async removeJudge(judgeUuid: string) {
    const userJudge = await this.prisma.user.findUniqueOrThrow({
      where: { uuid: judgeUuid },
      select: {
        judge: {
          select: {
            uuid: true,
          },
        },
      },
    });

    await this.prisma.user.update({
      where: { uuid: judgeUuid },
      data: {
        role: { connect: { name: RoleType.User } },
      },
    });

    await this.prisma.judge.delete({
      where: { uuid: userJudge.judge[0].uuid },
    });

    return {
      status: 'success',
      message: 'Judge deleted successfully',
    };
  }

  async findAllEvaluationParameter(competitionUuid: string) {
    const parameters = await this.prisma.evaluationParameter.findMany({
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
    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { uuid: submission_uuid },
      include: { competition: { include: { evaluation_parameter: true } } },
    });

    // Validasi bahwa juri adalah bagian dari kompetisi
    const judge = await this.prisma.judge.findFirstOrThrow({
      where: {
        user: { uuid: judgeUuid },
        competition_id: submission.competition_id,
      },
    });

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
          await this.prisma.evaluationParameter.findUniqueOrThrow({
            where: { uuid: param.parameter_uuid },
          });

        return this.prisma.score.create({
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
  }

  async getScoredSubmission(competitionUuid: string) {
    const scored = await this.prisma.submission.findMany({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'Approved',
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
    const unscored = await this.prisma.submission.findMany({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'Approved',
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
    const scoredSubmissions = await this.prisma.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'Approved',
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

    const unscoredSubmissions = await this.prisma.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'Approved',
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

    const totalSubmissions = await this.prisma.submission.count({
      where: {
        competition: { uuid: competitionUuid },
        content: {
          status: 'Approved',
        },
      },
    });

    const deadlineJudge = await this.prisma.competition.findUnique({
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
    const judge = await this.prisma.user.findUnique({
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
