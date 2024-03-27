import { Module } from '@nestjs/common';

import { redisClientFactory } from './redis.factory';
import { RedisRepository } from './repository/redis.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [redisClientFactory, RedisRepository],

  exports: [RedisRepository],
})
export class RedisModule {}
