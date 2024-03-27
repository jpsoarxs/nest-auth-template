import {
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Session } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { RedisRepository } from 'src/infrastructure/redis/repository/redis.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthSigninDto, AuthSignupDto } from './dto';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {}

  // `Signup` Route
  async signup(dto: AuthSignupDto): Promise<Tokens> {
    const password = await this.generateArgonHash(dto.password);

    try {
      const sessionId = randomUUID();
      const find = await this.prisma.user.count({
        where: { email: dto.email },
      });

      if (find > 0) {
        throw new HttpException('Username already exists', 409);
      }

      const newUser = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password,
        },
      });

      const tokens: Tokens = await this.generateTokens(
        newUser.id,
        newUser.email,
        sessionId,
      );

      await this.createRefreshTokenHash(
        newUser.id,
        tokens.refresh_token,
        sessionId,
      );
      return tokens;
    } catch (error) {
      throw error;
    }
  }

  // `SignIn` Route
  async signin(dto: AuthSigninDto): Promise<Tokens> {
    const sessionId = randomUUID();

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await argon2.verify(user.password, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens: Tokens = await this.generateTokens(
      user.id,
      user.email,
      sessionId,
    );
    await this.createRefreshTokenHash(user.id, tokens.refresh_token, sessionId);
    return tokens;
  }

  // `Logout` Route
  async logout(userId: string, session: string, accessToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        sessions: {
          where: {
            session_id: session,
          },
        },
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    await this.prisma.$transaction(async (prisma) => {
      await prisma.session.delete({
        where: { session_id: session },
      });
      await this.redisRepository.setWithExpiry(
        'blacklist',
        accessToken,
        'logged out',
        60 * Number(this.config.get('ACCESS_TOKEN_LIFE_TIME')),
      );
    });
  }

  // `RefreshToken` Route
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        sessions: true,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    let refreshTokenMatches: Session | null = null;
    for (const session of user.sessions) {
      const match = await argon2.verify(session.token, refreshToken);
      if (match) {
        refreshTokenMatches = session;
        break;
      }
    }

    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens: Tokens = await this.generateTokens(
      user.id,
      user.email,
      refreshTokenMatches.session_id,
    );
    await this.updateRefreshTokenHash(
      refreshTokenMatches.id,
      tokens.refresh_token,
    );
    return tokens;
  }

  /* --- Utility Functions --- */

  async generateArgonHash(data: string): Promise<string> {
    return await argon2.hash(data);
  }

  async createRefreshTokenHash(
    userId: string,
    refreshToken: string,
    sessionId: string,
  ): Promise<void> {
    const refreshTokenLifeTimeDays = Number(
      this.config.get('REFRESH_TOKEN_LIFE_TIME'),
    );
    const expirationDate = new Date();
    expirationDate.setSeconds(
      expirationDate.getSeconds() + refreshTokenLifeTimeDays * 24 * 60 * 60,
    );

    const hash = await this.generateArgonHash(refreshToken);
    await this.addToWhitelist(userId, hash, sessionId);
  }

  async updateRefreshTokenHash(
    sessionId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenLifeTimeDays = Number(
      this.config.get('REFRESH_TOKEN_LIFE_TIME'),
    );
    const expirationDate = new Date();
    expirationDate.setSeconds(
      expirationDate.getSeconds() + refreshTokenLifeTimeDays * 24 * 60 * 60,
    );

    const hash = await this.generateArgonHash(refreshToken);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        token: hash,
        expires: expirationDate,
      },
    });
  }

  async generateTokens(
    userId: string,
    username: string,
    sessionId: string,
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          session: sessionId,
        },
        {
          secret: this.config.get('JWT_ACCESS_TOKEN_SECRET_KEY'),
          expiresIn: this.config.get('ACCESS_TOKEN_LIFE_TIME') * 60,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          session: sessionId,
        },
        {
          secret: this.config.get('JWT_REFRESH_TOKEN_SECRET_KEY'),
          expiresIn: this.config.get('REFRESH_TOKEN_LIFE_TIME') * 24 * 60 * 60,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async addToWhitelist(userId: string, token: string, sessionId: string) {
    const refreshTokenLifeTimeDays = Number(
      this.config.get('REFRESH_TOKEN_LIFE_TIME'),
    );
    const expirationDate = new Date();
    expirationDate.setSeconds(
      expirationDate.getSeconds() + refreshTokenLifeTimeDays * 24 * 60 * 60,
    );

    return this.prisma.session.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        token,
        expires: expirationDate,
      },
    });
  }
}
