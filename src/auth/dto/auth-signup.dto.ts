import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import xss from 'xss';

export class AuthSignupDto {
  @ApiProperty({
    description: 'The name of the user',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => xss(value.trim()))
  name?: string;

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
  @Length(8, 15)
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message:
      'password must contain at least one uppercase character, a lowercase character, a digit, and a special character.',
  })
  @Transform(({ value }) => xss(value.trim()))
  password: string;
}
