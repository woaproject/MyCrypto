import { createSelector } from 'reselect';
import { getWalletType } from 'selectors/wallet';
import { AppState } from 'reducers';
import { getTransactionState } from './transaction';

function getSignState(state: AppState) {
  return getTransactionState(state).sign;
}

const signaturePending = createSelector(getWalletType, getSignState, (wtype, sign) => ({
  isHardwareWallet: wtype.isHardwareWallet,
  isSignaturePending: sign.pending
}));

function getSignedTx(state: AppState) {
  return getSignState(state).local.signedTransaction;
}

function getWeb3Tx(state: AppState) {
  return getSignState(state).web3.transaction;
}

function getSerializedTransaction(state: AppState) {
  return getWalletType(state).isWeb3Wallet ? getWeb3Tx(state) : getSignedTx(state);
}

export { signaturePending, getSignedTx, getWeb3Tx, getSignState, getSerializedTransaction };
