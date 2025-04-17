import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { EvaluationParameterDto } from './evaluation-parameter.dto';

export class CreateCompetitionDto {
  @ApiProperty({ example: 'https://example.com/thumbnail.jpg', type: String })
  thumbnail: string;

  @ApiProperty({ example: 'Title of competition', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Story', enum: ContentType })
  @IsNotEmpty()
  type: ContentType;

  @ApiProperty({ example: 'Description of competition', type: String })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'Guide of competition', type: String })
  @IsNotEmpty()
  @IsString()
  guide: string;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  start_date: Date;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  end_date: Date;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  submission_deadline: Date;

  @ApiProperty({ example: 3, type: Number, description: 'Number of winners' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  winner_count: number;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    type: [String],
    description: 'Array of UUIDs of judges for the competition',
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  judge_uuids: string[];

  @ApiProperty({
    example: [
      { parameterName: 'Creativity', weight: 0.4 },
      { parameterName: 'Originality', weight: 0.6 },
    ],
    type: [EvaluationParameterDto],
    description: 'Array of evaluation parameters for the competition',
  })
  @IsNotEmpty()
  @Type(() => EvaluationParameterDto)
  parameters?: EvaluationParameterDto[];
}
