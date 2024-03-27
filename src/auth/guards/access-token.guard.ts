import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { RedisRepository } from 'src/infrastructure/redis/repository/redis.repository';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride('is-public', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    const isBlacklisted = await this.redisRepository.get('blacklist', token);

    if (isBlacklisted) {
      throw new UnauthorizedException();
    }

    return super.canActivate(context);
  }
}
