import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegisterJudgeDto } from '../dto/register-judge.dto';
import { JudgeService } from './judge.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';
import { UpdateJudgeDto } from '../dto/update-judge.dto';
import { Request } from 'express';
import { FindJudgeDto } from '../dto/find-judge.dto';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';

@ApiTags('judge')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'judges', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Get()
  @Roles('staff')
  async getJudges(@Query() query: FindJudgeDto) {
    const { data, pagination } = await this.judgeService.findAllJudges(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Judges successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Post('add')
  @Roles('staff')
  async registerJudge(@Body() registerJudgeDto: RegisterJudgeDto) {
    try {
      await this.judgeService.regisNewJudge(registerJudgeDto);
      return SuccessResponse.create(
        null,
        'Judge successfully registered!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Patch(':judgeUuid')
  @Roles('staff')
  async updateJudge(
    @Param('judgeUuid') judgeUuid: string,
    @Body() updateJudgeDto: UpdateJudgeDto,
  ) {
    try {
      await this.judgeService.updateInfoJudge(judgeUuid, updateJudgeDto);
      return SuccessResponse.create(
        null,
        'Judge successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':judgeUuid')
  @Roles('staff')
  async removeJudge(@Param('judgeUuid') judgeUuid: string) {
    try {
      await this.judgeService.removeJudge(judgeUuid);
      return SuccessResponse.create(
        null,
        'Judge successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Patch(':judgeUuid/submission')
  @Roles('judge')
  async evaluateSubmission(
    @Param('judgeUuid') judgeUuid: string,
    @Body() evaluateSubmissionDto: EvaluateSubmissionDto,
  ) {
    try {
      await this.judgeService.evaluateSubmission(
        judgeUuid,
        evaluateSubmissionDto,
      );
      return SuccessResponse.create(
        null,
        'Submission successfully evaluated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get('scored/:competitionUuid')
  @Roles('judge')
  async scoredSubmission(@Param('competitionUuid') competitionUuid: string) {
    return SuccessResponse.create(
      await this.judgeService.getScoredSubmission(competitionUuid),
      'Scored submission successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('unscored/:competitionUuid')
  @Roles('judge')
  async unscoredSubmission(@Param('competitionUuid') competitionUuid: string) {
    return SuccessResponse.create(
      await this.judgeService.getUnscoredSubmission(competitionUuid),
      'Unscored submission successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('detail')
  @Roles('judge')
  async summaryJudges(@Req() req: Request) {
    const user = req.user;
    return SuccessResponse.create(
      await this.judgeService.getJudge(user['sub']),
      'Judge successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':competitionUuid/evaluation-parameters')
  @Roles('judge')
  async getEvaluationParameters(
    @Param('competitionUuid') competitionUuid: string,
  ) {
    return SuccessResponse.create(
      await this.judgeService.findAllEvaluationParameter(competitionUuid),
      'Evaluation parameters successfully fetched!',
      HttpStatus.OK,
    );
  }
}
