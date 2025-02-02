import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import ms from 'ms';
import { AuthChangePasswordDto } from './dto/auth-change-password.dto';
import { RoleType } from '@prisma/client';
import { AuthRegisterStudentDto } from './dto/auth-register-student.dto';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async sendVerificationEmail(uuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid },
      include: { role: true },
    });

    const token = this.jwtService.sign(
      { email: user.email, sub: user.uuid, role: user.role.name },
      {
        secret: this.configService.get<string>('AUTH_CONFIRM_EMAIL_SECRET'),
        expiresIn: this.configService.get<string>(
          'AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN',
        ),
      },
    );
    const verificationUrl = `${process.env.FRONTEND_DOMAIN}/auth/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Email Verification',
      template: './email-verification',
      context: {
        name: user.email,
        url: verificationUrl,
      },
    });

    this.logger.log(`Verification email sent to ${user.email}`);
  }

  // Verifikasi email berdasarkan token
  async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('AUTH_CONFIRM_EMAIL_SECRET'),
      });
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { uuid: payload.sub },
      });

      await this.prismaService.user.update({
        where: { uuid: user.uuid },
        data: { email_verified: true },
      });

      this.logger.log(`User ${user.email} has been verified`);
      return {
        status: 'success',
        message: 'Verification successful!',
      };
    } catch (e) {
      this.logger.log(e);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Mengirim email untuk reset password
  async sendPasswordResetEmail(authForgotPasswordDto: AuthForgotPasswordDto) {
    const { email } = authForgotPasswordDto;
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { email },
      include: { role: true },
    });

    const token = this.jwtService.sign(
      { email: user.email, sub: user.uuid, role: user.role.name },
      {
        secret: this.configService.get<string>('AUTH_FORGOT_SECRET'),
        expiresIn: this.configService.get<string>(
          'AUTH_FORGOT_TOKEN_EXPIRES_IN',
        ),
      },
    );

    const expiresIn = this.configService.get<string>(
      'AUTH_FORGOT_TOKEN_EXPIRES_IN',
    );
    const minutes = parseInt(expiresIn, 10);
    const reset_token_expires = addMinutes(new Date(), minutes);

    const hashedToken = await bcrypt.hash(token, 10);
    await this.prismaService.user.update({
      where: { email: user.email },
      data: {
        reset_password_token: hashedToken,
        reset_token_expires: reset_token_expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_DOMAIN}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset',
      template: './password-reset',
      context: {
        name: user.email,
        url: resetUrl,
      },
    });
  }

  // Reset password berdasarkan token
  async resetPassword(authResetPasswordDto: AuthResetPasswordDto) {
    const { password: newPassword, token } = authResetPasswordDto;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('AUTH_FORGOT_SECRET'),
      });
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { uuid: payload.sub },
      });

      if (user.reset_token_expires && user.reset_token_expires < new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      const isTokenValid = await bcrypt.compare(
        token,
        user.reset_password_token,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          reset_password_token: null,
          reset_token_expires: null,
        },
      });
    } catch (e) {
      this.logger.log(e);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async changePassword(authChangePassworddDto: AuthChangePasswordDto) {
    const { email, currentPassword, newPassword } = authChangePassworddDto;
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { email },
    });

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Oops! The current password you entered is incorrect. Please verify and try again.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_token_expires: null,
      },
    });

    return {
      status: 'success',
      message: 'Password changed successfully',
    };
  }

  // Mengganti email pengguna
  async changeEmail(uuid: string, newEmail: string) {
    await this.prismaService.user.findUniqueOrThrow({
      where: { email: newEmail },
    });

    await this.prismaService.user.update({
      where: { uuid },
      data: { email: newEmail, email_verified: false },
    });

    await this.sendVerificationEmail(uuid);
  }

  async login(
    authEmailLoginDto: AuthEmailLoginDto,
  ): Promise<{ accessToken?: string; refreshToken?: string; data?: any }> {
    const user = await this.prismaService.user.findUnique({
      where: { email: authEmailLoginDto.email },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User with email ${authEmailLoginDto.email} not found`,
      );
    }

    if (
      !user ||
      !(await bcrypt.compare(authEmailLoginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Password incorrect');
    }

    const payload = {
      email: user.email,
      sub: user.uuid,
      role: user.role.name,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('AUTH_JWT_SECRET'),
      expiresIn: this.configService.get<string>('AUTH_JWT_TOKEN_EXPIRES_IN'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('AUTH_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'AUTH_REFRESH_TOKEN_EXPIRES_IN',
      ),
    });

    await this.userService.updateRefreshToken(user.uuid, refreshToken);
    return {
      accessToken,
      refreshToken,
      data: {
        uuid: user.uuid,
        email: user.email,
      },
    };
  }

  async register(authRegisterLoginDto: AuthRegisterLoginDto) {
    const hashedPassword = await bcrypt.hash(authRegisterLoginDto.password, 10);

    const role = await this.prismaService.role.findUnique({
      where: { name: RoleType.user },
    });

    const user = await this.prismaService.user.create({
      data: {
        email: authRegisterLoginDto.email,
        password: hashedPassword,
        full_name: authRegisterLoginDto.full_name,
        email_verified: false,
        role: { connect: { uuid: role.uuid } },
      },
    });
    await this.sendVerificationEmail(user.uuid);

    return {
      status: 'success',
      message:
        'Register successful! Please check your email to verify your account.',
    };
  }

  async registerStudent(authRegisterStudentDto: AuthRegisterStudentDto) {
    const hashedPassword = await bcrypt.hash(
      authRegisterStudentDto.password,
      10,
    );
    const res = await this.prismaService.$transaction(async (prisma) => {
      const role = await prisma.role.findUniqueOrThrow({
        where: { name: RoleType.user },
      });

      const user = await prisma.user.create({
        data: {
          email: authRegisterStudentDto.email,
          password: hashedPassword,
          full_name: authRegisterStudentDto.full_name,
          email_verified: false,
          role: { connect: { uuid: role.uuid } },
        },
      });

      await prisma.student.create({
        data: {
          nis: authRegisterStudentDto.nis,
          name: authRegisterStudentDto.name,
          birthdate: authRegisterStudentDto.birthdate,
          birthplace: authRegisterStudentDto.birthplace,
          sex: authRegisterStudentDto.sex,
          user: { connect: { uuid: user.uuid } },
          major: { connect: { name: authRegisterStudentDto.major } },
        },
      });

      await this.sendVerificationEmail(user.uuid);

      return {
        status: 'success',
        message:
          'Register successfully! Please check your email to verify your account.',
      };
    });

    return res;
  }

  async validateUser(uuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid },
      include: { role: true },
    });

    return user;
  }

  async refreshTokens(refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken) as any;

    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOne(decoded.sub);

    if (
      !user ||
      !(await this.validateRefreshToken(user.data.uuid, refreshToken))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      email: user.data.email,
      sub: user.data.uuid,
      role: user.data.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('AUTH_JWT_SECRET'),
      expiresIn: this.configService.get<string>('AUTH_JWT_TOKEN_EXPIRES_IN'),
    });
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('AUTH_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'AUTH_REFRESH_TOKEN_EXPIRES_IN',
      ),
    });

    await this.userService.updateRefreshToken(user.data.uuid, newRefreshToken);

    return { accessToken, newRefreshToken };
  }

  async validateRefreshToken(
    uuid: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({ where: { uuid } });

    if (!user || !user.refresh_token) return false;

    return bcrypt.compare(refreshToken, user.refresh_token);
  }

  async logout(uuid: string): Promise<void> {
    await this.userService.clearRefreshToken(uuid);
  }

  async getLoginUser(uuid: string) {
    return await this.userService.findOne(uuid);
  }
}
