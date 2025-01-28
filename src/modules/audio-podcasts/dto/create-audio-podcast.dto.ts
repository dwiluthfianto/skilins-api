import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ContentDto } from 'src/modules/contents/dto/content.dto';

export class CreateAudioPodcastDto extends ContentDto {
  @ApiProperty({
    example: 2.3,
    type: Number,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  duration: number;

  @ApiProperty({
    type: String,
    format: 'binary',
  })
  file: string;
}
