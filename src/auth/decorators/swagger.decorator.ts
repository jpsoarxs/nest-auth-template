// decorators/api-refresh-auth.decorator.ts
import { HttpCode, HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

// path:/auth/refresh
export function ApiRefreshAuth() {
  return applyDecorators(
    ApiBearerAuth('refresh-token'),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer {refresh_token}',
    }),
    ApiOkResponse({
      description: 'Access created',
      schema: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    HttpCode(HttpStatus.OK),
  );
}

// Path:/auth/logout
export function ApiLogoutAuth() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer {access_token}',
    }),
    ApiOkResponse({ description: 'Logout successful' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    HttpCode(HttpStatus.OK),
  );
}
