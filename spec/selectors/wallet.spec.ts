import {
  getTokens,
  getWalletConfigTokens,
  getTokenBalances,
  getNonZeroTokenBalances,
  getTokenBalance,
  getShownTokenBalances,
  getNonZeroShownTokenBalances,
  getWalletType
} from 'selectors/wallet';
import { TokenValue } from 'libs/units';
import { getInitialState, testShallowlyEqual } from './helpers';

describe('selectors/wallet', () => {
  const tokenBalanceState = getInitialState();
  tokenBalanceState.config = {
    ...tokenBalanceState.config,
    network: {
      ...tokenBalanceState.config.network,
      tokens: [
        {
          address: 'test',
          symbol: 'TEST',
          decimal: 18
        },
        {
          address: 'zero',
          symbol: 'ZERO',
          decimal: 18
        }
      ]
    }
  };
  tokenBalanceState.wallet = {
    ...tokenBalanceState.wallet,
    tokens: {
      TEST: {
        balance: TokenValue('1'),
        error: null
      },
      ZERO: {
        balance: TokenValue('0'),
        error: null
      }
    }
  };

  const shownTkState = { ...tokenBalanceState };
  shownTkState.wallet.config = {
    tokens: ['TEST', 'ZERO']
  };
  const shownTkBalances = getShownTokenBalances(shownTkState);

  describe('getTokens', () => {
    const tokensState = { ...tokenBalanceState };
    tokensState.customTokens = [
      {
        address: 'also test',
        symbol: 'TEST2',
        decimal: 18
      }
    ];
    const tokens = getTokens(tokensState);

    it('should return network tokens + custom tokens, custom tokens last', () => {
      expect(tokens).toHaveLength(
        tokenBalanceState.config.network.tokens.length + tokensState.customTokens.length
      );
    });

    it('should mark custom tokens as such', () => {
      expect(tokens[tokenBalanceState.config.network.tokens.length].custom).toBeTruthy();
    });

    testShallowlyEqual(tokens, getTokens(tokensState));
  });

  describe('getWalletConfigTokens', () => {
    const walletConfigState = { ...tokenBalanceState };
    walletConfigState.wallet = {
      ...walletConfigState.wallet,
      config: { tokens: ['TEST'] }
    };
    const walletConfigTokens = getWalletConfigTokens(walletConfigState);

    const noWalletConfigState = getInitialState();
    walletConfigState.wallet = {
      ...walletConfigState.wallet,
      config: null
    };
    const noWalletConfigTokens = getWalletConfigTokens(noWalletConfigState);

    it('should return wallet config tokens, if there are any', () => {
      expect(walletConfigTokens).toBeTruthy();
      expect(walletConfigTokens).toHaveLength(1);
    });

    it('should return an empty array, if no wallet config', () => {
      expect(noWalletConfigTokens).toBeTruthy();
      expect(noWalletConfigTokens).toHaveLength(0);
    });

    // Test both config and no config to be shallowly equal
    testShallowlyEqual(walletConfigTokens, getWalletConfigTokens(walletConfigState));
    testShallowlyEqual(noWalletConfigTokens, getWalletConfigTokens(noWalletConfigState));
  });

  describe('getTokenBalances', () => {
    const state = getInitialState();
    testShallowlyEqual(getTokenBalances(state), getTokenBalances(state));
  });

  describe('getNonZeroTokenBalances', () => {
    const state = getInitialState();
    testShallowlyEqual(getNonZeroTokenBalances(state), getNonZeroTokenBalances(state));
  });

  describe('getTokenBalance', () => {
    const tokenBalance = getTokenBalance(tokenBalanceState, 'TEST');

    it('should retrieve the requested token’s balance', () => {
      expect(tokenBalance).toBeTruthy();
      expect(tokenBalance!.toString()).toBe('1');
    });

    it('should return null if no token matches the symbol', () => {
      expect(getTokenBalance(tokenBalanceState, 'NOT REAL')).toBeFalsy();
    });

    testShallowlyEqual(tokenBalance, getTokenBalance(tokenBalanceState, 'TEST'));
  });

  describe('getShownTokenBalances', () => {
    it('should retrieve balances matching wallet config tokens', () => {
      expect(shownTkBalances[0].symbol).toBe('TEST');
      expect(shownTkBalances[1].symbol).toBe('ZERO');
      expect(shownTkBalances).toHaveLength(2);
    });

    it('should exclude tokens that are in config, but not in balances', () => {
      const extraTkState = { ...shownTkState };
      extraTkState.wallet.config = {
        ...extraTkState.wallet.config,
        tokens: extraTkState.wallet.config!.tokens!.concat(['FAKE'])
      };
      const extraTkBalances = getShownTokenBalances(extraTkState);
      expect(shownTkBalances[0].symbol).toBe('TEST');
      expect(shownTkBalances[1].symbol).toBe('ZERO');
      expect(extraTkBalances).toHaveLength(2);
    });

    testShallowlyEqual(shownTkBalances, getShownTokenBalances(shownTkState));
  });

  describe('getNonZeroShownTokenBalances', () => {
    const nonZeroTkBalances = getNonZeroShownTokenBalances(shownTkState);

    it('should exclude zero balances, if passed that arg', () => {
      expect(nonZeroTkBalances[0].symbol).toBe('TEST');
      expect(nonZeroTkBalances).toHaveLength(1);
    });

    testShallowlyEqual(nonZeroTkBalances, getNonZeroShownTokenBalances(shownTkState));
  });

  describe('getWalletType', () => {
    const state = getInitialState();
    testShallowlyEqual(getWalletType(state), getWalletType(state));
  });
});
