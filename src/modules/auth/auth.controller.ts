import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  HttpCode,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthChangePasswordDto } from './dto/auth-change-password.dto';
import { AuthRegisterStudentDto } from './dto/auth-register-student.dto';

@ApiTags('Auth')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() authEmailLoginDto: AuthEmailLoginDto,
    @Res() res: Response,
  ) {
    const response = await this.authService.login(authEmailLoginDto);

    res.cookie('refresh_token', response.data.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.send(response);
  }

  @Post('register')
  async register(@Body() authRegisterLoginDto: AuthRegisterLoginDto) {
    return this.authService.register(authRegisterLoginDto);
  }

  @Post('register-student')
  async registerStudent(
    @Body() authRegisterStudentDto: AuthRegisterStudentDto,
  ) {
    return this.authService.registerStudent(authRegisterStudentDto);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getLoginUser(@Req() req: Request) {
    const user = req.user;

    return this.authService.getLoginUser(user['sub']);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      return res.status(HttpStatus.FORBIDDEN).send({
        status: 'error',
        message: 'Refresh token not found',
      });
    }

    try {
      const { access_token, refresh_token } =
        await this.authService.refreshTokens(refreshToken);

      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        status: 'success',
        access_token,
      });
    } catch (err) {
      console.error(err.message);
      return res.status(HttpStatus.FORBIDDEN).send({
        status: 'error',
        message: 'Invalid refresh token',
      });
    }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user;

    // Clear the refresh token from the database
    await this.authService.logout(user['sub']);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
    });

    return res.json({ status: 'success', message: 'Logged out successfully!' });
  }

  @Post('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() authForgotPasswordDto: AuthForgotPasswordDto) {
    return this.authService.sendPasswordResetEmail(authForgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() authResetPasswordDto: AuthResetPasswordDto) {
    return this.authService.resetPassword(authResetPasswordDto);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Body() authChangePasswordDto: AuthChangePasswordDto) {
    return this.authService.changePassword(authChangePasswordDto);
  }

  @Post('change-email')
  @UseGuards(AuthGuard('jwt'))
  async changeEmail(
    @Body('uuid') uuid: string,
    @Body('newEmail') newEmail: string,
  ) {
    return this.authService.changeEmail(uuid, newEmail);
  }
}
