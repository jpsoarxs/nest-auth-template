import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import xss from 'xss';

export class AuthSignupDto {
  // username
  @ApiProperty({
    description: 'The username of the user',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 10)
  @Matches(/^[a-z0-9_]*$/, {
    message:
      'username can only contain lowercase characters, digits, and underscores.',
  })
  @Transform(({ value }) => xss(value.trim()))
  username: string;

  // password
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
