import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class FindStudentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({ example: '44202312', type: String })
  @IsOptional()
  @IsString()
  nis?: string;

  @ApiPropertyOptional({ example: 'John Doe', type: String })
  @IsOptional()
  @IsString()
  name?: string;
  
  @ApiPropertyOptional({ example: 'John Doe', type: String })
  @IsOptional()
  @IsString()
  search?: string;


  @ApiPropertyOptional({ example: 'Kimia Industri', type: String })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Search by the status of student',
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
