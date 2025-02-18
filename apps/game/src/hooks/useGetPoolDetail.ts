import { useGetPoolDetailQuery } from '@/apis/pools';

export const useGetPoolDetail = ({ poolId, isActive }: { poolId: number; isActive: boolean }) => {
  const { data, ...rest } = useGetPoolDetailQuery({
    variables: {
      id: String(poolId),
    },
    enabled: !!poolId && isActive,
  });

  return {
    data,
    pool: data,
    currency: data?.currency,
    rounds: data?.rounds || [],
    poolPrizes: data?.poolPrizes || [],
    ...rest,
  };
};
