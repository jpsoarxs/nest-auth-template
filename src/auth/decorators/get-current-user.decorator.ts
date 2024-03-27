import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const getCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!data) return request.user;

    if (data === 'accessToken') {
      return request.get('Authorization').split(' ')[1];
    }

    return request.user[data];
  },
);
