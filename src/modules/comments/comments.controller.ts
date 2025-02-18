import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeleteCommentDto } from './dto/delete-comment.dto';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';

@ApiTags('Like & Comment')
@Controller({ path: 'comments', version: '1' })
@UseGuards(RolesGuard)
@ApiBasicAuth('JWT-auth')
@Roles('user', 'student', 'judge', 'staff')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}

  @Post(':uuid/create')
  async CommentContent(
    @Param('uuid') uuid: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    try {
      await this.commentsService.createComment(uuid, createCommentDto);
      return SuccessResponse.create(
        null,
        'Comment successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Post(':uuid/remove')
  async remove(
    @Param('uuid') contentUuid: string,
    @Body() deleteCommentDto: DeleteCommentDto,
  ) {
    try {
      await this.commentsService.removeComment(contentUuid, deleteCommentDto);
      return SuccessResponse.create(
        null,
        'Comment successfully removed!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
