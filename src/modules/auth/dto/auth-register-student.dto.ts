import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/common/utils/transformers/lower-case.transformer';
import { SexType } from '@prisma/client';

export class AuthRegisterStudentDto {
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

  @ApiProperty({ example: '123456', type: String })
  @IsNotEmpty()
  @IsString()
  nis: string;

  @ApiProperty({ example: 'Jane Doe', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'RPL',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  major: string;

  @ApiProperty({ example: 'Bogor', type: String })
  @IsNotEmpty()
  @IsString()
  birthplace: string;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  @IsNotEmpty()
  birthdate: Date;

  @ApiProperty({
    example: 'male',
    enum: SexType,
    enumName: 'SexType',
    type: SexType,
  })
  @IsNotEmpty()
  sex: SexType;
}
