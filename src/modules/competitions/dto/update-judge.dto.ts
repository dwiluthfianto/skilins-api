import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateJudgeDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  full_name: string;

  @ApiPropertyOptional({ example: 'UI/UX Designer | PT. Example' })
  @IsOptional()
  role: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/example' })
  @IsOptional()
  linkedin: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/example' })
  @IsOptional()
  instagram: string;
}
