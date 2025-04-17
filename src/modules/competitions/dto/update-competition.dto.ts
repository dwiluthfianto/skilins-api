import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateCompetitionDto } from './create-competition.dto';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContentType } from '@prisma/client';

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
  @ApiPropertyOptional({
    example: 'https://example.com/thumbnail.jpg',
    type: String,
  })
  thumbnail: string;

  @ApiPropertyOptional({ example: 'Title of competition', type: String })
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Story', enum: ContentType })
  @IsOptional()
  type: ContentType;

  @ApiPropertyOptional({ example: 'Guide of competition', type: String })
  @IsOptional()
  @IsString()
  guide: string;

  @ApiPropertyOptional({ example: 'Description of competition', type: String })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  start_date: Date;

  @ApiPropertyOptional({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  end_date: Date;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    type: [String],
    description: 'Array of UUIDs of judges for the competition',
  })
  @IsString({ each: true })
  @IsOptional({ each: true })
  judge_uuids: string[];
}
