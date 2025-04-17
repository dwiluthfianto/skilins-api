import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AddStoryEpisodeDto {
  @ApiProperty({
    example: 'episode 2: the network',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: ' Actual text or description of the episode',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  order: number;
}
