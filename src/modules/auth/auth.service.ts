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
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthChangePasswordDto } from './dto/auth-change-password.dto';
import { RoleType, SexType } from '@prisma/client';
import { AuthRegisterStudentDto } from './dto/auth-register-student.dto';
import ms from 'ms';
import { EmailService } from '../mailer/mailer.service';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

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
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async forgotPassword(authForgotPasswordDto: AuthForgotPasswordDto) {
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

    const expiresIn = this.configService.get<any>(
      'AUTH_FORGOT_TOKEN_EXPIRES_IN',
    );

    const reset_token_expires = ms(expiresIn);

    const hashedToken = crypto
      .createHmac('sha256', process.env.AUTH_FORGOT_SECRET)
      .update(token)
      .digest('hex');

    await this.prismaService.user.update({
      where: { email: user.email },
      data: {
        reset_password_token: hashedToken,
        reset_token_expires: reset_token_expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_DOMAIN}/auth/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
  }

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

      const hashedToken = crypto
        .createHmac('sha256', process.env.AUTH_FORGOT_SECRET)
        .update(token)
        .digest('hex');

      if (hashedToken !== user.reset_password_token) {
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
  }

  async changeEmail(uuid: string, newEmail: string) {
    const user = await this.prismaService.user.findUnique({
      where: { uuid },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prismaService.user.update({
      where: { uuid },
      data: { email: newEmail, email_verified: false },
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

    await this.emailService.sendVerificationEmail(newEmail, verificationUrl);
  }

  async login(authEmailLoginDto: AuthEmailLoginDto): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { email: authEmailLoginDto.email },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User with email ${authEmailLoginDto.email} not found`,
      );
    }


    if (user.role.name === RoleType.student) {
      const student = await this.prismaService.student.findUnique({
        where: { user_id: user.id },
      });

      
      if (!student.status) {
        throw new UnauthorizedException(
          'Student is not verified, please contact staff',
        );
      }
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
      uuid: user.uuid,
      email: user.email,
      role: user.role.name,
      access_token: accessToken,
      refresh_token: refreshToken,
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

    this.emailService.sendVerificationEmail(user.email, verificationUrl);
  }

  async registerStudent(authRegisterStudentDto: AuthRegisterStudentDto) {
    const hashedPassword = await bcrypt.hash(
      authRegisterStudentDto.password,
      10,
    );

    const major = await this.prismaService.major.findUnique({
      where: { name: authRegisterStudentDto.major },
    });

    const user = await this.prismaService.user.create({
      data: {
        email: authRegisterStudentDto.email,
        password: hashedPassword,
        full_name: authRegisterStudentDto.full_name,
        email_verified: false,
        role: { connect: { name: RoleType.user } },
        student: {
          create: {
            nis: authRegisterStudentDto.nis,
            name: authRegisterStudentDto.name,
            birthdate: authRegisterStudentDto.birthdate,
            birthplace: authRegisterStudentDto.birthplace,
            sex: authRegisterStudentDto.sex as SexType,
            major: { connect: { uuid: major.uuid } },
          },
        },
      },
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

    this.emailService.sendVerificationEmail(user.email, verificationUrl);
  }

  async refreshTokens(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const token = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('AUTH_REFRESH_SECRET'),
      });
      const user = await this.userService.findOne(token.sub);

      if (
        !user ||
        !(await this.validateRefreshToken(user.uuid, refreshToken))
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = {
        email: user.email,
        sub: user.uuid,
        role: user.role,
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

      await this.userService.updateRefreshToken(user.uuid, newRefreshToken);

      return { access_token: accessToken, refresh_token: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateRefreshToken(
    uuid: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({ where: { uuid } });
    if (!user || !user.refresh_token) return false;

    const hashedToken = crypto
      .createHmac('sha256', process.env.AUTH_REFRESH_SECRET)
      .update(refreshToken)
      .digest('hex');
    return hashedToken === user.refresh_token;
  }

  async logout(uuid: string): Promise<void> {
    await this.userService.clearRefreshToken(uuid);
  }

  async getLoginUser(uuid: string) {
    return await this.userService.findOne(uuid);
  }
}
