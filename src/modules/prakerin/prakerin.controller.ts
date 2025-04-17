import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  UploadedFiles,
  Query,
  Req,
} from '@nestjs/common';
import { PrakerinService } from './prakerin.service';
import { CreatePrakerinDto } from './dto/create-prakerin.dto';
import { UpdatePrakerinDto } from './dto/update-prakerin.dto';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Prakerin } from './entities/prakerin.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';
import { FindPrakerinQueryDto } from '@modules/contents/dto/find-prakerin-query.dto';
import { Request } from 'express';

@ApiTags('Prakerin')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/prakerin', version: '1' })
export class PrakerinController {
  constructor(
    private readonly prakerinService: PrakerinService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiCreatedResponse({
    type: Prakerin,
  })
  @FileUpload()
  async createPrakerin(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createPrakerinDto: CreatePrakerinDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );

      const file_prakerin = this.fileUploadService.handleFileUpload(
        files.file[0],
      );

      await this.prakerinService.createPrakerin(user['sub'], {
        ...createPrakerinDto,
        thumbnail: thumbnail.filePath,
        file: file_prakerin.filePath,
      });
      return SuccessResponse.create(
        null,
        'Prakerin successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getPrakerin(@Query() query: FindPrakerinQueryDto) {
    const { data, pagination } =
      await this.prakerinService.findAllPrakerinByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Prakerin successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async getPrakerinByStaff(@Query() query: FindPrakerinQueryDto) {
    const { data, pagination } =
      await this.prakerinService.findAllPrakerinByStaff(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Prakerin successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('summary-staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async summaryPrakerinStaff() {
    return SuccessResponse.create(
      await this.prakerinService.summaryPrakerinStaff(),
      'Prakerin summary successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async findUserPrakerin(@Req() req: Request) {
    const user = req.user;
    return SuccessResponse.create(
      await this.prakerinService.fetchUserPrakerin(user['sub']),
      'Prakerin successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  async getPrakerinBySlug(@Param('slug') slug: string) {
    return SuccessResponse.create(
      await this.prakerinService.findPrakerinBySlug(slug),
      'Prakerin successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('student')
  @FileUpload()
  async updatePrakerin(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() updatePrakerinDto: UpdatePrakerinDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    try {
      const isExist = await this.prakerinService.findPrakerinByUuid(uuid);

      const thumbnail =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.updateFile(
              isExist.thumbnail,
              files.thumbnail[0],
            )
          : { filePath: isExist.thumbnail };

      const file_prakerin =
        files.file && files.file[0]
          ? this.fileUploadService.updateFile(
              isExist.prakerin.file_attachment.file,
              files.file[0],
            )
          : { filePath: isExist.prakerin.file_attachment.file };

      await this.prakerinService.updatePrakerinByUuid(uuid, user['sub'], {
        ...updatePrakerinDto,
        thumbnail: thumbnail.filePath,
        file: file_prakerin.filePath,
      });

      return SuccessResponse.create(
        null,
        'Prakerin successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('student', 'staff')
  async removePrakerin(@Param('contentUuid') contentUuid: string) {
    try {
      const isExist =
        await this.prakerinService.findPrakerinByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.thumbnail);
      this.fileUploadService.deleteFile(isExist.prakerin.file_attachment.file);

      await this.prakerinService.removePrakerinByUuid(contentUuid);

      return SuccessResponse.create(
        null,
        'Prakerin successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
