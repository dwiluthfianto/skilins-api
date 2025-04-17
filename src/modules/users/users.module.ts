import { Global, Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';

@Global()
@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
