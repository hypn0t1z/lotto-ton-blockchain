import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LatestBlock,
  Network,
  NetworkToken,
  Pool,
  PoolRound,
  Token,
  TokenPrice,
  Transaction,
  UserTicket,
} from '@/database/entities';

import { ManagerService } from './manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Network,
      Token,
      NetworkToken,
      TokenPrice,
      LatestBlock,
      Transaction,
      UserTicket,
      PoolRound,
      Pool,
    ]),
    // ServicesModule,
  ],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class WorkerModule {}
