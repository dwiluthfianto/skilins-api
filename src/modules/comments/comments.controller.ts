import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Like & Comment')
@Controller({ path: 'api/v1/comments', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':uuid/create')
  async CommentContent(
    @Param('uuid') uuid: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(uuid, createCommentDto);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
  //   return this.commentsService.update(+id, updateCommentDto);
  // }

  @Post(':uuid/remove')
  remove(
    @Param('uuid') contentUuid: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const { commented_by } = updateCommentDto;
    return this.commentsService.remove(contentUuid, commented_by);
  }
}
