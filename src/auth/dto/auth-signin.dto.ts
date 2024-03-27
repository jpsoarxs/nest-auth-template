import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import xss from 'xss';

export class AuthSigninDto {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => xss(value.trim()))
  email: string;

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
