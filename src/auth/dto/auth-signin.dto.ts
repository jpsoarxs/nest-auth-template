import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import xss from 'xss';

export class AuthSigninDto {
  @ApiProperty({
    description: 'The username of the user',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  @Transform(({ value }) => xss(value.trim()))
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  @Transform(({ value }) => xss(value.trim()))
  password: string;
}
