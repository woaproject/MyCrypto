import { AppState } from 'reducers';
import { getTransactionState } from './transaction';
import { getSignState } from './sign';

function getBroadcastState(state: AppState) {
  return getTransactionState(state).broadcast;
}

function getTransactionStatus(state: AppState, indexingHash: string) {
  return getBroadcastState(state)[indexingHash];
}

function currentTransactionFailed(state: AppState) {
  const txExists = getCurrentTransactionStatus(state);
  return txExists && !txExists.broadcastSuccessful;
}

// Note: if the transaction or the indexing hash doesn't exist, we have a problem
function currentTransactionBroadcasting(state: AppState) {
  const txExists = getCurrentTransactionStatus(state);

  return txExists && txExists.isBroadcasting;
}

function currentTransactionBroadcasted(state: AppState) {
  const txExists = getCurrentTransactionStatus(state);

  return txExists && !txExists.isBroadcasting;
}

function getCurrentTransactionStatus(state: AppState) {
  const { indexingHash } = getSignState(state);
  if (!indexingHash) {
    return false;
  }
  const txExists = getTransactionStatus(state, indexingHash);
  return txExists;
}

export {
  getTransactionStatus,
  currentTransactionBroadcasting,
  currentTransactionBroadcasted,
  getCurrentTransactionStatus,
  currentTransactionFailed
};
