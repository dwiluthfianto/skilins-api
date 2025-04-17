import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { CookieOptions, CookieSettings } from '@interfaces/cookie.interface';

export const COOKIE_NAMES_KEY = 'cookieNames';
export const COOKIE_OPTIONS_KEY = 'cookieOptions';
export const COOKIE_SETTINGS_KEY = 'cookieSettings';

export const ClearCookies = (...cookies: string[]) =>
  SetMetadata(COOKIE_NAMES_KEY, cookies);

export const Cookies = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);

export const SignedCookies = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.signedCookies?.[data] : request.signedCookies;
  },
);

export function SetCookies(
  options?: CookieOptions | CookieSettings | CookieSettings[],
  cookies?: CookieSettings | CookieSettings[],
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (options) {
      if (!Array.isArray(options) && !('name' in options)) {
        SetMetadata(COOKIE_OPTIONS_KEY, options)(
          target,
          propertyKey,
          descriptor,
        );
      } else {
        cookies = [options] as CookieSettings[];
      }
    }

    if (cookies) {
      SetMetadata(
        COOKIE_SETTINGS_KEY,
        Array.isArray(cookies) ? cookies : [cookies],
      )(target, propertyKey, descriptor);
    }
  };
}
