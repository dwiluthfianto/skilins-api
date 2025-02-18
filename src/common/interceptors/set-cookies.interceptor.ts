import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import {
  COOKIE_OPTIONS_KEY,
  COOKIE_SETTINGS_KEY,
} from '@decorators/cookie.decorator';
import { CookieOptions, CookieSettings } from '@interfaces/cookie.interface';

@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    const defaultOptions = Reflect.getMetadata(
      COOKIE_OPTIONS_KEY,
      context.getHandler(),
    ) as CookieOptions;

    const predefinedCookies = (Reflect.getMetadata(
      COOKIE_SETTINGS_KEY,
      context.getHandler(),
    ) || []) as CookieSettings[];
    request._cookies = request._cookies || [];

    return next.handle().pipe(
      tap(() => {
        const allCookies = [...predefinedCookies, ...request._cookies];

        allCookies.forEach(({ name, value, options }) => {
          const mergedOptions = { ...defaultOptions, ...options };
          if (value) {
            response.cookie(name, value, mergedOptions);
          } else {
            response.clearCookie(name, mergedOptions);
          }
        });
      }),
    );
  }
}
