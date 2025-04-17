import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import fs from 'fs';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT')
        ? parseInt(this.configService.get('MAIL_PORT'), 10)
        : 587,
      ignoreTLS: this.configService.get('MAIL_IGNORE_TLS') === 'true',
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  private loadTemplate(templateName: string): handlebars.TemplateDelegate {
    const templatesFolderPath = path.join(__dirname, './templates');

    const templatePath = path.join(templatesFolderPath, `${templateName}.hbs`);

    console.log(templatePath);

    try {
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      this.templates.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error loading email template: ${templateName}`,
      );
    }
  }

  private getTemplate(templateName: string): handlebars.TemplateDelegate {
    return this.templates.get(templateName) || this.loadTemplate(templateName);
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        to,
        subject,
        html,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error sending email: ${error.message}`,
      );
    }
  }

  async sendVerificationEmail(email: string, url: string) {
    const template = this.getTemplate('email-verification');
    const html = template({
      name: email,
      url,
    });
    await this.sendMail(email, 'Email Verification', html);
  }

  async sendPasswordResetEmail(email: string, url: string) {
    const template = this.getTemplate('password-reset');
    const html = template({
      name: email,
      url,
    });
    await this.sendMail(email, 'Password Reset', html);
  }

  async sendSubmissionApprovedEmail(
    email: string,
    name: string,
    competitionName: string,
    titleSubmission: string,
    submissionId: string,
    submissionDate: string,
    judgingDates: string,
    announcementDate: string,
  ) {
    const template = this.getTemplate('submission-approved');
    const html = template({
      name,
      competition_name: competitionName,
      title_submission: titleSubmission,
      submission_id: submissionId,
      submission_date: submissionDate,
      judging_dates: judgingDates,
      announcement_date: announcementDate,
    });
    await this.sendMail(email, 'Submission Approved', html);
  }

  async sendSubmissionRejectedEmail(
    email: string,
    name: string,
    competitionName: string,
    titleSubmission: string,
    submissionId: string,
    submissionDate: string,
  ) {
    const template = this.getTemplate('submission-rejected');
    const html = template({
      name,
      competition_name: competitionName,
      title_submission: titleSubmission,
      submission_id: submissionId,
      submission_date: submissionDate,
    });
    await this.sendMail(email, 'Submission Rejected', html);
  }
}
