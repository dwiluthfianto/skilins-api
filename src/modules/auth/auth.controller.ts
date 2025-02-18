import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthChangePasswordDto } from './dto/auth-change-password.dto';
import { AuthRegisterStudentDto } from './dto/auth-register-student.dto';
import { Public } from '@decorators/public.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { Roles } from '@decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';

import { RoleType } from '@prisma/client';
import {
  ClearCookies,
  SetCookies,
  SignedCookies,
} from '@decorators/cookie.decorator';
import { Request } from 'express';
import ms from 'ms';
import { SetCookiesInterceptor } from '@interceptors/set-cookies.interceptor';
import { ClearCookiesInterceptor } from '@interceptors/clear-cookies.interceptor';

@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'auth', version: '1' })
@UseInterceptors(SetCookiesInterceptor, ClearCookiesInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @SetCookies({
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
  @ApiOperation({ summary: 'User login' })
  async login(@Req() req, @Body() authEmailLoginDto: AuthEmailLoginDto) {
    const { refresh_token, ...data } =
      await this.authService.login(authEmailLoginDto);

    req._cookies = [
      {
        name: 'refresh_token',
        value: refresh_token,
        options: {
          maxAge: ms(process.env.AUTH_JWT_TOKEN_EXPIRES_IN as any),
        },
      },
    ];

    return SuccessResponse.create(
      { ...data },
      'Login successful',
      HttpStatus.CREATED,
    );
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() authRegisterLoginDto: AuthRegisterLoginDto) {
    await this.authService.register(authRegisterLoginDto);
    return SuccessResponse.create(
      null,
      'Registration successful! Please check your email to verify your account.',
      HttpStatus.CREATED,
    );
  }

  @Public()
  @Post('register-student')
  @ApiOperation({ summary: 'Register new student' })
  async registerStudent(
    @Body() authRegisterStudentDto: AuthRegisterStudentDto,
  ) {
    await this.authService.registerStudent(authRegisterStudentDto);
    return SuccessResponse.create(
      null,
      'Student registration successful! Please check your email to verify your account.',
      HttpStatus.CREATED,
    );
  }

  @Post('logout')
  @ClearCookies('refresh_token')
  @ApiOperation({ summary: 'User logout' })
  async logout(@Req() req: Request) {
    await this.authService.logout(req.user['sub']);
    return SuccessResponse.create(
      null,
      'Logged out successfully',
      HttpStatus.CREATED,
    );
  }

  @Public()
  @Post('refresh')
  @SetCookies({
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req,
    @SignedCookies('refresh_token') refreshToken: string,
  ) {
    const { access_token, refresh_token } =
      await this.authService.refreshTokens(refreshToken);

    req._cookies = [
      {
        name: 'refresh_token',
        value: refresh_token,
        options: {
          maxAge: ms(process.env.AUTH_JWT_TOKEN_EXPIRES_IN as any),
        },
      },
    ];

    return SuccessResponse.create(
      { access_token },
      'Token refreshed',
      HttpStatus.CREATED,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user' })
  async getLoginUser(@Req() req: Request) {
    const data = await this.authService.getLoginUser(req.user['sub']);
    return SuccessResponse.create(data);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return SuccessResponse.create(null, 'Email verification successful');
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() authForgotPasswordDto: AuthForgotPasswordDto) {
    await this.authService.forgotPassword(authForgotPasswordDto);
    return SuccessResponse.create(
      null,
      'Password reset instructions sent to your email',
    );
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@Body() authResetPasswordDto: AuthResetPasswordDto) {
    await this.authService.resetPassword(authResetPasswordDto);
    return SuccessResponse.create(null, 'Password reset successful');
  }

  @Post('change-password')
  @UseGuards(RolesGuard)
  @Roles(RoleType.staff, RoleType.student, RoleType.user)
  @ApiOperation({ summary: 'Change current password' })
  async changePassword(@Body() authChangePasswordDto: AuthChangePasswordDto) {
    await this.authService.changePassword(authChangePasswordDto);
    return SuccessResponse.create(
      null,
      'Password changed successfully',
      HttpStatus.OK,
    );
  }

  @Post('change-email')
  @UseGuards(RolesGuard)
  @Roles(RoleType.staff, RoleType.student, RoleType.user)
  @ApiOperation({ summary: 'Change user email' })
  async changeEmail(@Req() req: Request, @Body('newEmail') newEmail: string) {
    await this.authService.changeEmail(req.user['sub'], newEmail);
    return SuccessResponse.create(
      null,
      'Email changed successfully. Please verify your new email',
    );
  }
}
