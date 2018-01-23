import { getTransaction, getGasCost, signaturePending } from 'selectors/transaction';
import { getInitialState, testShallowlyEqual } from './helpers';
import { Wei } from 'libs/units';

describe('selectrons/transaction', () => {
  describe('getTransaction', () => {
    const state = getInitialState();
    const transaction = getTransaction(state);

    it('should return the transaction and if it’s a full one', () => {
      expect(transaction.transaction).toBeTruthy();
      expect(transaction.isFullTransaction).toBeDefined();
    });

    testShallowlyEqual(transaction, getTransaction(state));
  });

  describe('getGasCost', () => {
    const gasCostState = getInitialState();
    gasCostState.transaction = {
      ...gasCostState.transaction,
      fields: {
        ...gasCostState.transaction.fields,
        gasPrice: {
          raw: 'Doesn’t matter',
          value: Wei('2')
        },
        gasLimit: {
          raw: 'Doesn’t matter',
          value: Wei('2')
        }
      }
    };
    const gasCost = getGasCost(gasCostState);

    it('should return the gas cost', () => {
      expect(gasCost.toString()).toBe('4');
    });

    it('should return zero wei if gas limit value is falsy', () => {
      const zeroGasCostState = getInitialState();
      zeroGasCostState.transaction = {
        ...zeroGasCostState.transaction,
        fields: {
          ...zeroGasCostState.transaction.fields,
          gasPrice: {
            raw: 'Doesn’t matter',
            value: Wei('1000000000000')
          },
          gasLimit: {
            raw: 'Doesn’t matter',
            value: null
          }
        }
      };
      const zeroGasCost = getGasCost(zeroGasCostState);
      expect(zeroGasCost.toString()).toBe('0');
    });

    testShallowlyEqual(gasCost, getGasCost(gasCostState));
  });

  describe('signaturePending', () => {
    const state = getInitialState();
    const sigPending = signaturePending(state);

    it('should return if the signature is pending, and if it’s a hardware wallet', () => {
      expect(sigPending.isSignaturePending).toBeDefined();
      expect(sigPending.isHardwareWallet).toBeDefined();
    });

    testShallowlyEqual(sigPending, signaturePending(state));
  });
});
