import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public, getCurrentUser, getCurrentUserId } from 'src/auth/decorators';
import { AtGuard, RtGuard } from 'src/auth/guards';
import { AuthService } from './auth.service';
import { ApiLogoutAuth, ApiRefreshAuth } from './decorators/swagger.decorator';
import { AuthSigninDto, AuthSignupDto } from './dto';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: AuthSignupDto): Promise<Tokens> {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: AuthSigninDto): Promise<Tokens> {
    return this.authService.signin(dto);
  }

  @Post('logout')
  @UseGuards(AtGuard)
  @ApiLogoutAuth()
  logout(
    @getCurrentUserId() userId: string,
    @getCurrentUser('session') session: string,
    @getCurrentUser('accessToken') accessToken: string,
  ) {
    return this.authService.logout(userId, session, accessToken);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RtGuard)
  @ApiRefreshAuth()
  refreshTokens(
    @getCurrentUserId() userId: string,
    @getCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
