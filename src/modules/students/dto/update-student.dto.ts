import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, IsString } from 'class-validator';
import { SexType } from '@prisma/client';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({ example: '123456', type: String })
  @IsOptional()
  nis?: string;

  @ApiPropertyOptional({ example: 'Jane Doe', type: String })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'RPL',
    type: String,
  })
  @IsOptional()
  major: string;

  @ApiPropertyOptional({ example: 'Bogor', type: String })
  @IsOptional()
  birthplace?: string;

  @ApiPropertyOptional({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @IsOptional()
  birthdate?: Date;

  @ApiPropertyOptional({ example: 'male', enum: SexType })
  @IsOptional()
  sex: SexType;

  @ApiPropertyOptional({ example: 'true', type: Boolean })
  @IsOptional()
  status?: boolean = true;

  @ApiPropertyOptional({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  @IsOptional()
  @IsString()
  user_uuid: string;
}
