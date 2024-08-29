import React, { FC, useMemo } from 'react';
import Image from 'next/image';

import { prettyNumber } from '@/lib/common';
import { HStack, VStack } from '@/components/ui/Utilities';

import PoolAction from './PoolAction';
import { AnimatePresence, motion } from 'framer-motion';
import { slideAnimation } from '@/modules/LandingPage/utils/const';
import WinningNumber from '@/modules/CheckPage/components/CheckPrizeDrawer/WinningNumber';
import UserTicketCount from './UserTicketCount';
import { useGetPoolDetail } from '@/hooks/useGetPoolDetail';
import { IGetPoolDetailCurrency } from '@/apis/pools';

interface Props {
  ticketPrice: number;
  currentRound: string;
  isEndRound?: boolean;
  poolId: number;
  roundId: number;
  currency: IGetPoolDetailCurrency | undefined;
}

const PoolPrizePot: FC<Props> = ({ ticketPrice, currentRound, isEndRound = false, poolId, roundId, currency }) => {
  const renderContent = useMemo(() => {
    if (!isEndRound) {
      return (
        <div className="p-5 border-y border-y-navigate-tab min-h-[12.875rem]">
          <AnimatePresence mode="wait">
            <motion.div key={currentRound} {...slideAnimation}>
              <VStack align={'center'}>
                <div className="text-white">
                  <div className="text-center">Prize Pot</div>

                  <HStack pos={'center'} spacing={8}>
                    <Image src={'/images/tokens/ton_symbol.webp'} width={30} height={30} alt="ton" />
                    <span className="text-primary text-2xl font-semibold">{`${prettyNumber(2500)} ${currency?.symbol || ''}`}</span>
                  </HStack>

                  <div className="text-xs text-gray-color text-center">{`~ ${prettyNumber(10000)} USD`}</div>
                </div>

                <PoolAction
                  holdingTicket={0}
                  ticketPrice={ticketPrice}
                  poolId={poolId || 0}
                  roundId={roundId}
                  currency={currency}
                />
              </VStack>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    return (
      <VStack className="min-h-[11.375rem] border-t border-t-navigate-tab">
        <AnimatePresence mode="wait">
          <motion.div key={currentRound} {...slideAnimation} className="flex-1 flex flex-col">
            <VStack spacing={0} justify={'between'} className="flex-1">
              <WinningNumber code="b2a5" titleClassName="mx-auto" spacing={12} className="py-2" />

              <div className="border-y border-y-navigate-tab py-4">
                <UserTicketCount />
              </div>
            </VStack>
          </motion.div>
        </AnimatePresence>
      </VStack>
    );
  }, [currentRound, isEndRound, ticketPrice]);

  return <>{renderContent}</>;
};

export default PoolPrizePot;
