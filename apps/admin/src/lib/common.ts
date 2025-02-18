import { BigNumber } from 'bignumber.js';
import { formatUnits, getAddress, isAddress } from 'viem';

import { REGEX_EMOJI, REGEX_NO_SPECIAL_CHARACTERS } from './regex';
import { differenceInCalendarDays } from 'date-fns';

export function capitalizeFirstLetter(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function shortenString(str?: string, length = 10) {
  if (!str) return '';
  if (str?.length < length) return str;
  return `${str.substring(0, length)}...${str.substring(str.length - 4)}`;
}

export function shortenName(str?: string, length = 20) {
  if (!str) return '';
  if (str?.length < length) return str;
  return `${str.substring(0, length)}...`;
}

export const shortenEmail = (email?: string) => {
  if (!email) return '***@gmail.com';
  return email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < gp3.length; i++) {
      // eslint-disable-next-line no-param-reassign
      gp2 += '*';
    }
    return gp2;
  });
};

export const getSCTime = (time?: any) => {
  if (!time) return BigInt(0);
  const formatTime = String(time).length === 13 ? Math.floor(+time / 1000) : time;
  return formatTime as any;
};

export const onMutateError = (err: any) => {
  console.error(err);
};

export const handleSmcError = (failureReason: any) => {
  console.error(failureReason?.shortMessage ?? failureReason?.cause?.message ?? 'Something went wrong');
};

export const sleep = async (time: number) => {
  return new Promise<void>((resolve) =>
    // eslint-disable-next-line no-promise-executor-return
    setTimeout(() => {
      resolve();
    }, time)
  );
};

export const debounce = <F extends (...args: any) => any>(func: F, waitFor: number) => {
  const timeout = 0;

  const debounced = (...args: any) => {
    clearTimeout(timeout);
    setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

export const getSignMessage = (nonce: number) => {
  return (
    'Welcome. By signing this message you are verifying your digital identity. This is completely secure and does not cost anything!' +
    ` Nonce: ${nonce}`
  );
};

export const getMessageSignature = (nonce?: number) => {
  const msg =
    'Welcome. By signing this message you are verifying your digital identity. This is completely secure and does not cost anything!';

  return nonce ? `${msg} Nonce: ${nonce}` : msg;
};

export const validateFileSize = (file: File, size = 10): boolean => {
  if (!file || typeof file === 'string') return true;
  return file?.size <= size * 1024 * 1024;
};

export const getFileName = (file: string) => {
  return file.substr(file.lastIndexOf('\\') + 1).split('.')[0];
};

export const formatFileName = (name: string) => {
  const dotIndex = name.lastIndexOf('.');
  return name.substring(0, dotIndex);
};

export const validateFolder = (webkitRelativePath: string) => {
  return webkitRelativePath.split('/').length >= 2;
};

export const isSameAddress = (addrA?: string | null, addrB?: string | null) => {
  return addrA?.toLowerCase() === addrB?.toLowerCase();
};

export const requiredMessage = (field?: string) => (field ? `${field} field is required` : 'This field is required');

export const validateEmoji = (text: string): boolean => {
  return REGEX_EMOJI.test(text);
};

export const validateCharacterSpecial = (text: string) => {
  return !REGEX_NO_SPECIAL_CHARACTERS.test(text);
};

export const makeList = (length: number = 0) => Array.from({ length }).fill(1);

export function isJSON(str: string) {
  try {
    return JSON.parse(str) && !!str;
  } catch (e) {
    return false;
  }
}

export function shortenAddress(address?: string | null, length = 4): string | undefined | null {
  if (!address) return address;

  const isRightAddress = isAddress(address);
  if (!isRightAddress) return address.length > 20 ? shortenString(address, length) : address;

  try {
    const formattedAddress = getAddress(address);
    return shortenString(formattedAddress, length);
  } catch {
    throw new TypeError("Invalid input, address can't be parsed");
  }
}

export const amountEmptyNumberInit = {
  amount: 0,
  currency: '',
};

export const textToBalances = (balancesText: string) => {
  const balanceTexts = balancesText.split(',');
  if (balanceTexts.length === 0) {
    return [amountEmptyNumberInit];
  }
  const balances = balanceTexts.map(convertTextToAmount);
  return balances;
};

const convertTextToAmount = (text: string) => {
  const balance = text
    .trim()
    // eslint-disable-next-line quotes
    .replace('"', '')
    .match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+|)/g);

  const amount = balance && balance?.length > 0 ? balance[0] : 0.0;
  const currency = balance && balance?.length > 1 ? balance[1] : '';
  return {
    amount: BigNumber(amount).toNumber(),
    amountFormatted: Number(formatUnits(BigInt(BigNumber(amount).toNumber()), 6)).toLocaleString(undefined, {
      maximumFractionDigits: 5,
    }),
    currency,
  };
};

export function isPastDate(date: Date) {
  return differenceInCalendarDays(date, new Date()) < 0;
}