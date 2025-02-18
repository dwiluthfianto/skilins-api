import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { COOKIE_NAMES_KEY } from '@decorators/cookie.decorator';

@Injectable()
export class ClearCookiesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const cookiesToClear =
      Reflect.getMetadata(COOKIE_NAMES_KEY, context.getHandler()) || [];

    return next.handle().pipe(
      tap(() => {
        cookiesToClear.forEach((cookieName: string) => {
          response.clearCookie(cookieName);
        });
      }),
    );
  }
}
