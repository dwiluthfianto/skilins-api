import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commentBy: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commentUuid: string;
}
