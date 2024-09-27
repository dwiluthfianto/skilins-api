import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { ContentType } from '@prisma/client';
import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class ContentDto {
  // @ApiProperty({ enum: ContentType })
  // @IsEnum(ContentType)
  // @IsNotEmpty()
  // type: ContentType;

  @ApiProperty({ example: 'Content Title', type: String })
  @IsNotEmpty()
  @MinLength(10)
  title: string;

  @ApiProperty({ example: 'https://example.com/thumbnail.jpg', type: String })
  @IsNotEmpty()
  thumbnail: string;

  @ApiPropertyOptional({ example: 'This is a description', type: String })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['Tech', 'Science'], type: [String] })
  @IsOptional()
  subjects?: string[];

  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  @IsNotEmpty()
  category_uuid: string;
}
