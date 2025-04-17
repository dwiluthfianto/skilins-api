import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class EvaluateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  submission_uuid: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterScoreDto)
  parameter_scores: ParameterScoreDto[];
}

export class ParameterScoreDto {
  @IsNotEmpty()
  @IsString()
  parameter_uuid: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
