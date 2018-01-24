import { createSelector } from 'reselect';
import { TokenValue, Wei } from 'libs/units';
import { Token } from 'config';
import { AppState } from 'reducers';
import { getNetworkTokens } from 'selectors/config';
import { getCustomTokens } from 'selectors/customTokens';
import { Web3Wallet, LedgerWallet, TrezorWallet } from 'libs/wallet';
import { isEtherTransaction, getUnit } from './transaction';

function getWalletTokenBalances(state: AppState) {
  return state.wallet.tokens;
}

export function getWalletInst(state: AppState) {
  return state.wallet.inst;
}

export function getWalletConfig(state: AppState) {
  return state.wallet.config;
}

export function isWalletFullyUnlocked(state: AppState) {
  return state.wallet.inst && !state.wallet.inst.isReadOnly;
}

export interface TokenBalance {
  symbol: string;
  balance: TokenValue;
  custom?: boolean;
  decimal: number;
  error: string | null;
}

export type MergedToken = Token & {
  custom?: boolean;
};

export const getTokens = createSelector(
  getNetworkTokens,
  getCustomTokens,
  (tokens, customTokens): MergedToken[] => {
    return tokens.concat(
      customTokens.map((token: Token) => {
        const mergedToken = { ...token, custom: true };
        return mergedToken;
      })
    );
  }
);

export const getWalletConfigTokens = createSelector(
  getTokens,
  getWalletConfig,
  (tokens, config) => {
    if (!config || !config.tokens) {
      return [];
    }
    return config.tokens
      .map(symbol => tokens.find(t => t.symbol === symbol))
      .filter(token => token) as MergedToken[];
  }
);

export function getToken(state: AppState, unit: string): MergedToken | undefined {
  const tokens = getTokens(state);
  const token = tokens.find(t => t.symbol === unit);
  return token;
}

export const getTokenBalances = createSelector(
  getTokens,
  getWalletTokenBalances,
  (tokens, tkBalances) => {
    if (!tokens) {
      return [];
    }
    return tokens.map(t => ({
      symbol: t.symbol,
      balance: tkBalances[t.symbol] ? tkBalances[t.symbol].balance : TokenValue('0'),
      error: tkBalances[t.symbol] ? tkBalances[t.symbol].error : null,
      custom: t.custom,
      decimal: t.decimal
    }));
  }
);

export const getNonZeroTokenBalances = createSelector(getTokenBalances, tokenBalances =>
  tokenBalances.filter(t => !t.balance.isZero())
);

export function getTokenBalance(state: AppState, unit: string): TokenValue | null {
  const token = getTokenWithBalance(state, unit);
  if (!token) {
    return null;
  }
  return token.balance;
}

export function getTokenWithBalance(state: AppState, symbol: string): TokenBalance | null {
  const tokens = getTokenBalances(state);
  const balance = tokens.find(t => t.symbol === symbol);
  return balance || null;
}

export interface IWalletType {
  isWeb3Wallet: boolean;
  isHardwareWallet: boolean;
}

export function getWallet(state: AppState) {
  return state.wallet;
}

export const getWalletType = createSelector(getWalletInst, (wallet): IWalletType => {
  const isWeb3Wallet = wallet instanceof Web3Wallet;
  const isLedgerWallet = wallet instanceof LedgerWallet;
  const isTrezorWallet = wallet instanceof TrezorWallet;
  const isHardwareWallet = isLedgerWallet || isTrezorWallet;
  return { isWeb3Wallet, isHardwareWallet };
});

export function isUnlocked(state: AppState) {
  return !!getWalletInst(state);
}

export function getEtherBalance(state: AppState): Wei | null {
  return getWallet(state).balance.wei;
}

export function getCurrentBalance(state: AppState): Wei | TokenValue | null {
  const etherTransaction = isEtherTransaction(state);
  if (etherTransaction) {
    return getEtherBalance(state);
  } else {
    const unit = getUnit(state);
    return getTokenBalance(state, unit);
  }
}

const getShown = (tokenBalances, walletConfig: AppState['wallet']['config']) => {
  let walletTokens: string[] = [];
  if (walletConfig) {
    if (walletConfig.tokens) {
      walletTokens = walletConfig.tokens;
    }
  }

  return tokenBalances.filter(t => walletTokens.includes(t.symbol));
};

export const getShownTokenBalances = createSelector(getTokenBalances, getWalletConfig, getShown);

export const getNonZeroShownTokenBalances = createSelector(
  getNonZeroTokenBalances,
  getWalletConfig,
  getShown
);
