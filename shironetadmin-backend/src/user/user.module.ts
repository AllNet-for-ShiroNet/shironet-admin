import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AimeUser } from './entities/aime-user.entity';
import { AimeCard } from './entities/aime-card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AimeUser, AimeCard])
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule]
})
export class UserModule {}