import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { RatingService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Request } from 'express';

@ApiTags('Rating & Comment')
@Controller({ path: 'ratings', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBasicAuth('JWT-auth')
@Roles('User', 'staff', 'student', 'judge')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post(':contentUuid')
  create(
    @Param('contentUuid') contentUuid: string,
    @Req() req: Request,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    const user = req.user;
    return this.ratingService.ratingContent(
      user['sub'],
      contentUuid,
      createRatingDto,
    );
  }

  @Get(':contentUuid/check')
  async getUserRating(
    @Param('contentUuid') contentUuid: string,
    @Req() req: Request,
  ) {
    const user = req.user;
    return this.ratingService.getUserRating(contentUuid, user['sub']);
  }
}
