import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ContentDto } from 'src/modules/contents/dto/content.dto';

export class CreateVideoPodcastDto extends ContentDto {
  @ApiProperty({
    example: 'https://example.com/video.mp4',
    type: String,
  })
  @IsNotEmpty()
  link: string;
}
