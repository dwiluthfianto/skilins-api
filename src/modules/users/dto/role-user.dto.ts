import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RoleUserDto {
  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'User', enum: RoleType, default: RoleType.user })
  @IsNotEmpty()
  role: RoleType;
}
