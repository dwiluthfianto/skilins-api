import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
        ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
        secure: process.env.MAIL_SECURE === 'true',
        requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },

      defaults: {
        from: `"No Reply" <${process.env.MAIL_DEFAULT_EMAIL}>`,
      },
      template: {
        dir: join(process.cwd(), 'src', 'modules', 'mailer', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
})
export class MailerConfigModule {}
