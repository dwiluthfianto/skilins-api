import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commented_by: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment_content: string;
}
