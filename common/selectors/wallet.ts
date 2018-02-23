import { createSelector } from 'reselect';
import { TokenValue, Wei } from 'libs/units';
import { SecureWalletName, WalletName } from 'config';
import { AppState } from 'reducers';
import { getNetworkConfig, getNetworkTokens, getOffline } from 'selectors/config';
import { Web3Wallet, LedgerWallet, TrezorWallet } from 'libs/wallet';
import { getCustomTokens } from 'selectors/customTokens';
import { isEtherTransaction, getUnit } from './transaction';
import { DisabledWallets } from 'components/WalletDecrypt';
import { Token } from 'types/network';
import { unSupportedWalletFormatsOnNetwork } from 'selectors/config/wallet';

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

export const isEtherBalancePending = (state: AppState): boolean =>
  getWallet(state).balance.isPending;

export const getEtherBalance = (state: AppState): Wei | null => getWallet(state).balance.wei;

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

// TODO: Convert to reselect selector (Issue #884)
export function getDisabledWallets(state: AppState): DisabledWallets {
  const network = getNetworkConfig(state);
  const isOffline = getOffline(state);
  const disabledWallets: DisabledWallets = {
    wallets: [],
    reasons: {}
  };

  const addReason = (wallets: WalletName[], reason: string) => {
    if (!wallets.length) {
      return;
    }

    disabledWallets.wallets = disabledWallets.wallets.concat(wallets);
    wallets.forEach(wallet => {
      disabledWallets.reasons[wallet] = reason;
    });
  };

  // Some wallets don't support some networks
  addReason(
    unSupportedWalletFormatsOnNetwork(state),
    `${network.name} does not support this wallet`
  );

  // Some wallets are unavailable offline
  if (isOffline) {
    addReason(
      [SecureWalletName.WEB3, SecureWalletName.TREZOR],
      'This wallet cannot be accessed offline'
    );
  }

  // Some wallets are disabled on certain platforms
  if (process.env.BUILD_DOWNLOADABLE) {
    addReason([SecureWalletName.LEDGER_NANO_S], 'This wallet is only supported at MyCrypto.com');
  }
  if (process.env.BUILD_ELECTRON) {
    addReason([SecureWalletName.WEB3], 'This wallet is not supported in the MyCrypto app');
  }

  // Dedupe and sort for consistency
  disabledWallets.wallets = disabledWallets.wallets
    .filter((name, idx) => disabledWallets.wallets.indexOf(name) === idx)
    .sort();

  return disabledWallets;
}
