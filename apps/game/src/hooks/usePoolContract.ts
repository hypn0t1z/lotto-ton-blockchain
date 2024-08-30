import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address, beginCell, OpenedContract } from '@ton/core';
import Pool from '@/contracts/pool';
import { useMemo } from 'react';
import { env } from '@/lib/const';
import { useTonWallet } from '@tonconnect/ui-react';

interface IBuyTicket {
  poolId: number;
  roundId: number;
  quantity: number;
}

export function usePoolContract() {
  const client = useTonClient();
  const wallet = useTonWallet();
  const { sender } = useTonConnect();

  const provider = useMemo(() => {
    if (!client) return;

    return client.provider(Address.parse(env.CONTRACT_ADDRESS));
  }, [client]);

  const poolContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new Pool(Address.parse(env.CONTRACT_ADDRESS));

    return client.open(contract) as OpenedContract<Pool>;
  }, [client]);

  return {
    address: poolContract?.address.toString(),
    buyTicket: async (data: IBuyTicket) => {
      if (!provider || !wallet) return;

      const messageBody = beginCell()
        .storeUint(3748203161, 32)
        .storeInt(data?.poolId, 257) //poolId
        .storeInt(data?.roundId, 257) //roundId
        .storeInt(data?.quantity, 257) //quantity
        .endCell();

      return await poolContract?.buyTicket(provider, sender, messageBody);
    },
  };
}
