import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EvaluationParameterDto {
  @ApiProperty({
    example: 'Creativity',
    type: String,
    description: 'Name of the evaluation parameter',
  })
  @IsNotEmpty()
  @IsString()
  parameterName: string;

  @ApiProperty({
    example: 0.5,
    type: Number,
    description: 'Weight of the evaluation parameter (0 to 1)',
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsNumber()
  weight: number;
}
