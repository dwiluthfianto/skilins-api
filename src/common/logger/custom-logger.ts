import { LoggerService } from '@nestjs/common';

export class CustomLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {
    console.log('This function logs the information', message);
  }

  fatal(message: any, ...optionalParams: any[]) {
    console.log(`💥 ${message} 💥`);
  }

  error(message: any, ...optionalParams: any[]) {
    console.log(`❌ ${message} ❌`);
  }

  warn(message: any, ...optionalParams: any[]) {
    console.log(`⚠️ ${message} ⚠️`);
  }

  debug?(message: any, ...optionalParams: any[]) {
    console.log(`🪲 ${message} 🪲`);
  }
}
