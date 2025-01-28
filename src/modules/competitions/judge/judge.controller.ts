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
import { Roles } from 'src/modules/roles/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';
import { UpdateJudgeDto } from '../dto/update-judge.dto';
import { Request } from 'express';

@ApiTags('Judge')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'judges', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Get()
  @Roles('Staff')
  @HttpCode(HttpStatus.OK)
  async findAllJudges(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.judgeService.findAllJudges(page, limit, search);
  }

  @Post('add')
  @Roles('Staff')
  async registerJudge(@Body() registerJudgeDto: RegisterJudgeDto) {
    return await this.judgeService.regisNewJudge(registerJudgeDto);
  }

  @Patch(':judgeUuid')
  @Roles('Staff')
  async updateJudge(
    @Param('judgeUuid') judgeUuid: string,
    @Body() updateJudgeDto: UpdateJudgeDto,
  ) {
    return await this.judgeService.updateInfoJudge(judgeUuid, updateJudgeDto);
  }

  @Delete(':judgeUuid')
  @Roles('Staff')
  async removeJudge(@Param('judgeUuid') judgeUuid: string) {
    return await this.judgeService.removeJudge(judgeUuid);
  }

  @Patch(':judgeUuid/submission')
  @Roles('Judge')
  async evaluateSubmission(
    @Param('judgeUuid') judgeUuid: string,
    @Body() evaluateSubmissionDto: EvaluateSubmissionDto,
  ) {
    return await this.judgeService.evaluateSubmission(
      judgeUuid,
      evaluateSubmissionDto,
    );
  }

  @Get('scored/:competitionUuid')
  @Roles('Judge')
  @HttpCode(HttpStatus.OK)
  async scoredSubmission(@Param('competitionUuid') competitionUuid: string) {
    return await this.judgeService.getScoredSubmission(competitionUuid);
  }

  @Get('unscored/:competitionUuid')
  @Roles('Judge')
  @HttpCode(HttpStatus.OK)
  async unscoredSubmission(@Param('competitionUuid') competitionUuid: string) {
    return await this.judgeService.getUnscoredSubmission(competitionUuid);
  }

  @Get('detail')
  @Roles('Judge')
  @HttpCode(HttpStatus.OK)
  async summaryJudges(@Req() req: Request) {
    const user = req.user;
    return await this.judgeService.getJudge(user['sub']);
  }

  @Get(':competitionUuid/evaluation-parameters')
  @Roles('Judge')
  @HttpCode(HttpStatus.OK)
  async getEvaluationParameters(
    @Param('competitionUuid') competitionUuid: string,
  ) {
    return this.judgeService.findAllEvaluationParameter(competitionUuid);
  }
}
