import { Global, Module } from '@nestjs/common';
import { EmailService } from './mailer.service';

@Global()
@Module({
  imports: [],
  providers: [EmailService],
  exports: [EmailService],
})
export class MailerModule {}
