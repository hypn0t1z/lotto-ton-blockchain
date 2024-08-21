import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { Pool, PoolPrize, PoolRound, Token } from '@/database/entities';
import type { QueryPaginationDto } from '@/shared/dto/pagination.query';
import { PoolStatusEnum } from '@/shared/enums';
import { FetchType, paginateEntities } from '@/utils/paginate';

import type { CreatePoolDto, PoolPrizes } from './dto/create-pool.dto';
import type { PoolQueryDto } from './dto/get-pool.query';
import { Causes } from '@/common/exceptions/causes';
import { PoolRoundService } from '../poolRound/poolRound.service';
import { UpdatePoolDto } from './dto/update-pool.dto';

export class PoolService {
  constructor(
    @InjectRepository(Pool) private readonly poolRepository: Repository<Pool>,
    @InjectRepository(PoolRound)
    private readonly roundRepository: Repository<PoolRound>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(PoolPrize)
    private readonly poolPrizesRepository: Repository<PoolPrize>,
    private readonly poolRoundService: PoolRoundService,
  ) {}
  async create(createPoolDto: CreatePoolDto) {
    try {
      const pool = new Pool();
      pool.name = createPoolDto.name;
      pool.currency = await this.tokenRepository.findOne({
        where: { id: +createPoolDto.currency },
      });
      pool.sequency = createPoolDto.sequency;
      pool.totalRounds = createPoolDto.totalRounds;
      pool.startTime = createPoolDto.startTime;
      pool.ticketPrice = createPoolDto.ticketPrice;
      pool.endTime = dayjs(createPoolDto.startTime)
        .add(createPoolDto.sequency * createPoolDto.totalRounds, 'days')
        .toDate();

      await this.poolRepository.save(pool);

      let startTime = createPoolDto.startTime;
      for (let i = 1; i <= createPoolDto.totalRounds; i++) {
        const endTime = dayjs(startTime)
          .add(createPoolDto.sequency, 'days')
          .toDate();
        const round = new PoolRound();
        round.startTime = dayjs(startTime).toDate();
        round.endTime = endTime;
        round.pool = pool;
        round.roundNumber = i;
        await this.roundRepository.save(round);
        startTime = endTime;
      }
      const poolPrizes = createPoolDto.poolPrizes.map((poolDto) => {
        const poolPrize = new PoolPrize();
        poolPrize.pool = pool;
        poolPrize.matchNumber = poolDto.matchNumber;
        poolPrize.allocation = poolDto.allocation;
        return poolPrize;
      });
      await this.poolPrizesRepository.save(poolPrizes);

      return pool;
    } catch (error) {
      throw error;
    }
  }

  async update(poolId: number, updatePoolDto: UpdatePoolDto) {
    const poolExist = await this.findOne(poolId);
    if (!poolExist) throw Causes.NOT_FOUND('Pool');

    if (dayjs(poolExist.startTime) > dayjs()) {
      const pool = await this.newPoolForUpdate({
        ...updatePoolDto,
        startTime: updatePoolDto?.startTime ?? poolExist.startTime,
        sequency: updatePoolDto?.sequency ?? poolExist.sequency,
        totalRounds: updatePoolDto?.totalRounds ?? poolExist.totalRounds,
      });
      await this.poolRepository.update(poolId, pool);

      const numChangeRound = poolExist.totalRounds - updatePoolDto.totalRounds;
      const isChangeStartTime = poolExist.startTime !== updatePoolDto.startTime;

      if (Math.abs(numChangeRound) > 0 || isChangeStartTime) {
        await this.poolRoundService.deleteRoundsFromTime(
          poolId,
          poolExist.startTime,
        );

        let startTime = updatePoolDto.startTime;
        for (let i = 1; i <= updatePoolDto.totalRounds; i++) {
          const endTime = dayjs(startTime)
            .add(updatePoolDto.sequency, 'days')
            .toDate();
          const round = new PoolRound();
          round.startTime = dayjs(startTime).toDate();
          round.endTime = endTime;
          round.pool = poolExist;
          round.roundNumber = i;
          await this.poolRoundService.create(round);
          startTime = endTime;
        }

        const prizes: Partial<PoolPrize>[] = [];
        for (const prize of updatePoolDto.poolPrizes) {
          prizes.push({
            allocation: prize.allocation,
            pool: poolExist,
            matchNumber: prize.matchNumber,
          });
        }
        await this.poolPrizesRepository
          .createQueryBuilder()
          .insert()
          .into(PoolPrize)
          .values(prizes)
          .orUpdate(['allocation'], ['poolId', 'matchNumber'])
          .execute();
      }
    } else {
      if (poolExist.name !== updatePoolDto.name)
        throw new BadRequestException('Name cannot be changed');
      if (poolExist.currency.id !== updatePoolDto.currency)
        throw new BadRequestException('Currency cannot be changed');
      if (
        dayjs(poolExist.startTime).toISOString() !==
        dayjs(updatePoolDto.startTime).toISOString()
      )
        throw new BadRequestException('Start time cannot be changed');
      if (poolExist.sequency !== updatePoolDto.sequency)
        throw new BadRequestException('Sequency cannot be changed');
      if (Number(poolExist.ticketPrice) !== Number(updatePoolDto.ticketPrice))
        throw new BadRequestException('Ticket price cannot be changed');

      if (!this.checkPoolPrizes(poolExist.poolPrizes, updatePoolDto.poolPrizes))
        throw new BadRequestException('Pool prizes cannot be changed');

      const countRoundOnGoing = await this.poolRoundService.countOnGoing(
        poolId,
      );

      if (updatePoolDto.totalRounds > poolExist.totalRounds) {
        // Add new
        let startTime = poolExist.endTime;
        for (
          let i = 1;
          i <= updatePoolDto.totalRounds - poolExist.totalRounds;
          i++
        ) {
          const endTime = dayjs(startTime)
            .add(updatePoolDto.sequency, 'days')
            .toDate();
          const round = new PoolRound();
          round.startTime = dayjs(startTime).toDate();
          round.endTime = endTime;
          round.pool = poolExist;
          round.roundNumber = poolExist.totalRounds + i;
          await this.poolRoundService.create(round);
          startTime = endTime;
        }
      }

      if (updatePoolDto.totalRounds < poolExist.totalRounds) {
        console.log(countRoundOnGoing, updatePoolDto.totalRounds);

        // Remove some
        if (countRoundOnGoing <= updatePoolDto.totalRounds) {
          await this.poolRoundService.deleteRoundGreaterRoundNumber(
            poolId,
            updatePoolDto.totalRounds + 1,
          );
        } else if (countRoundOnGoing > updatePoolDto.totalRounds) {
          throw new BadRequestException(
            'Total number of rounds cannot be changed to less than number of on-going rounds',
          );
        }
      }

      const pool = await this.newPoolForUpdate({
        ...updatePoolDto,
        startTime: updatePoolDto?.startTime ?? poolExist.startTime,
        sequency: updatePoolDto?.sequency ?? poolExist.sequency,
        totalRounds: updatePoolDto?.totalRounds ?? poolExist.totalRounds,
      });
      await this.poolRepository.update(poolId, pool);
    }

    return true;
  }

  async find(pagination: QueryPaginationDto, query: PoolQueryDto) {
    try {
      const { status, search } = query;
      const queryBuilder = this.poolRepository.createQueryBuilder('pool');

      if (search) {
        queryBuilder.andWhere('pool.name LIKE :search ', {
          search: `%${search}%`,
        });
      }
      if (status && status == PoolStatusEnum.UPCOMING) {
        queryBuilder.andWhere('pool.startTime > NOW()');
      }
      if (status && status == PoolStatusEnum.ONGOING) {
        queryBuilder.andWhere(
          'pool.startTime < NOW() AND pool.endTime > NOW()',
        );
      }
      if (status && status == PoolStatusEnum.CLOSED) {
        queryBuilder.andWhere('pool.endTime < NOW()');
      }
      if (status && status == PoolStatusEnum.DELETE) {
        queryBuilder.andWhere('pool.deletedAt IS NOT NULL').withDeleted();
      }

      return await paginateEntities<Pool>(
        queryBuilder,
        pagination,
        FetchType.MANAGED,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  findOne(id: number) {
    try {
      const pool = this.poolRepository
        .createQueryBuilder('pool')
        .leftJoinAndSelect('pool.currency', 'token')
        .leftJoinAndSelect('pool.rounds', 'rounds')
        .leftJoinAndSelect('pool.poolPrizes', 'prizes')
        .where('pool.id = :poolId', { poolId: id })
        .getOne();
      return pool;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  checkPoolPrizes(prizesDB: PoolPrize[], prizesUpdate: PoolPrizes[]) {
    let status = true;

    prizesDB.map((prize) => {
      const prizesExistId = prizesUpdate.findIndex(
        (prizeUpdate) => prizeUpdate.matchNumber === prize.matchNumber,
      );

      if (
        prizesExistId > 0 &&
        prizesUpdate[prizesExistId].allocation !== prize.allocation
      )
        status = false;
    });

    return status;
  }

  async newPoolForUpdate(updatePoolDto: UpdatePoolDto) {
    const pool = new Pool();

    updatePoolDto?.name && (pool.name = updatePoolDto?.name);
    updatePoolDto?.currency &&
      (pool.currency = await this.tokenRepository.findOne({
        where: { id: +updatePoolDto?.currency },
      }));
    updatePoolDto?.sequency && (pool.sequency = updatePoolDto?.sequency);
    updatePoolDto?.totalRounds &&
      (pool.totalRounds = updatePoolDto?.totalRounds);
    updatePoolDto?.startTime && (pool.startTime = updatePoolDto?.startTime);
    updatePoolDto?.ticketPrice &&
      (pool.ticketPrice = updatePoolDto?.ticketPrice);
    (!!updatePoolDto?.startTime ||
      !!updatePoolDto?.sequency ||
      !!updatePoolDto?.totalRounds) &&
      (pool.endTime = dayjs(updatePoolDto?.startTime)
        .add(updatePoolDto?.sequency * updatePoolDto?.totalRounds, 'days')
        .toDate());

    return pool;
  }
}
