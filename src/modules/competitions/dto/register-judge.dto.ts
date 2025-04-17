import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/common/utils/transformers/lower-case.transformer';

export class RegisterJudgeDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  full_name: string;

  @ApiPropertyOptional({ example: 'UI/UX Designer | PT. Example' })
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/example' })
  @IsOptional()
  linkedin: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/example' })
  @IsOptional()
  instagram: string;
}
