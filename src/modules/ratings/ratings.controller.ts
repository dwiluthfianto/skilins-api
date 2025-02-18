import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { RatingService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';

@ApiTags('Rating & Comment')
@Controller({ path: 'ratings', version: '1' })
@UseGuards(RolesGuard)
@Roles('user', 'staff', 'student', 'judge')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post(':contentUuid')
  async createRating(
    @Param('contentUuid') contentUuid: string,
    @Req() req: Request,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    const user = req.user;
    try {
      await this.ratingService.ratingContent(
        user['sub'],
        contentUuid,
        createRatingDto,
      );
      return SuccessResponse.create(
        null,
        'Rating successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get(':contentUuid/check')
  async getUserRating(
    @Param('contentUuid') contentUuid: string,
    @Req() req: Request,
  ) {
    const user = req.user;
    return SuccessResponse.create(
      await this.ratingService.getUserRating(contentUuid, user['sub']),
      'Rating successfully fetched!',
      HttpStatus.OK,
    );
  }
}
