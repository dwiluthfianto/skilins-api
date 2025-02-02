import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/modules/roles/roles.decorator';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Competition } from '../entities/competition.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';

@ApiTags('Submission')
@Controller({ path: 'competitions/submissions', version: '1' })
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Patch(':submissionUuid/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @HttpCode(HttpStatus.OK)
  approveSubmission(@Param('submissionUuid') submissionUuid: string) {
    return this.submissionService.approveSubmission(submissionUuid);
  }

  @Patch(':submissionUuid/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @HttpCode(HttpStatus.OK)
  rejectSubmission(@Param('submissionUuid') submissionUuid: string) {
    return this.submissionService.rejectSubmission(submissionUuid);
  }

  @Post('submit')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @ApiCreatedResponse({
    type: Competition,
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'thumbnail' }, { name: 'file' }]),
  )
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @HttpCode(HttpStatus.CREATED)
  async submitToCompetition(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFiles()
    files: {
      thumbnail: Express.Multer.File;
      file: Express.Multer.File;
    },
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    const user = req.user;

    try {
      // Upload thumbnail if present
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail,
      );

      switch (createSubmissionDto.type) {
        case 'audio':
          createSubmissionDto.audioData.thumbnail = thumbnail.filePath;
          break;
        case 'video':
          createSubmissionDto.videoData.thumbnail = thumbnail.filePath;
          break;
        case 'prakerin':
          createSubmissionDto.prakerinData.thumbnail = thumbnail.filePath;
          break;
      }

      switch (createSubmissionDto.type) {
        case 'audio':
          const file_audio = this.fileUploadService.handleFileUpload(
            files.file,
          );
          createSubmissionDto.audioData.file = file_audio.filePath;

          break;

        case 'video':
          break;

        case 'prakerin':
          const file_prakerin = this.fileUploadService.handleFileUpload(
            files.file,
          );
          createSubmissionDto.prakerinData.file = file_prakerin.filePath;
          break;

        default:
          throw new Error('Unsupported submission type');
      }

      // Proceed to submit to competition
      const submit = await this.submissionService.submitToCompetition(
        user['sub'],
        createSubmissionDto,
      );

      return res.status(HttpStatus.CREATED).json(submit);
    } catch (e) {
      console.error('Error during submission creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create submission.',
        detail: e.message,
      });
    }
  }
}
