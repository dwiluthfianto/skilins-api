import { ApiProperty } from '@nestjs/swagger';
import { SexType } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStudentDto {
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

  @ApiProperty({ example: 'male', enum: SexType })
  @IsNotEmpty()
  sex: SexType;

  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  user_uuid: string;
}
