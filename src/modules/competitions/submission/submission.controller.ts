import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { SuccessResponse } from '@utils/api-response.util';
import { FileUpload } from '@decorators/file-upload.decorator';
import { ApiException } from '@exceptions/api-exception';

@ApiTags('Submission')
@Controller({ path: 'competitions/submissions', version: '1' })
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Patch(':submissionUuid/approve')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async approveSubmission(@Param('submissionUuid') submissionUuid: string) {
    return SuccessResponse.create(
      await this.submissionService.approveSubmission(submissionUuid),
      'Submission approved successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':submissionUuid/reject')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async rejectSubmission(@Param('submissionUuid') submissionUuid: string) {
    return SuccessResponse.create(
      await this.submissionService.rejectSubmission(submissionUuid),
      'Submission rejected successfully',
      HttpStatus.OK,
    );
  }

  @Post('submit')
  @UseGuards(RolesGuard)
  @Roles('student')
  @FileUpload()
  async submitToCompetition(
    @Req() req: Request,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    const user = req.user;

    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );

      switch (createSubmissionDto.type) {
        case 'audio':
          const file_audio = this.fileUploadService.handleFileUpload(
            files.file[0],
          );
          createSubmissionDto.audioData.thumbnail = thumbnail.filePath;
          createSubmissionDto.audioData.file = file_audio.filePath;

          break;

        case 'video':
          createSubmissionDto.videoData.thumbnail = thumbnail.filePath;
          break;

        case 'prakerin':
          const file_prakerin = this.fileUploadService.handleFileUpload(
            files.file[0],
          );
          createSubmissionDto.prakerinData.thumbnail = thumbnail.filePath;
          createSubmissionDto.prakerinData.file = file_prakerin.filePath;
          break;

        default:
          throw new Error('Unsupported submission type');
      }

      await this.submissionService.submitToCompetition(
        user['sub'],
        createSubmissionDto,
      );

      return SuccessResponse.create(
        null,
        'Submission submitted successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
