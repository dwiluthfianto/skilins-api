import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'test1@example.com', type: IsEmail })
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail()
  email: string;
}
