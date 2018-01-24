import { AppState } from 'reducers';
import { getTransactionState, getGasCost } from 'selectors/transaction';
import { getEtherBalance } from 'selectors/wallet';
import { getOffline } from 'selectors/config';

function getFields(state: AppState) {
  return getTransactionState(state).fields;
}

function getTo(state: AppState) {
  return getFields(state).to;
}

function getData(state: AppState) {
  return getFields(state).data;
}

function getGasLimit(state: AppState) {
  return getFields(state).gasLimit;
}

function getGasPrice(state: AppState) {
  return getFields(state).gasPrice;
}

function getValue(state: AppState) {
  return getFields(state).value;
}

function getNonce(state: AppState) {
  return getFields(state).nonce;
}

function getDataExists(state: AppState) {
  const { value } = getData(state);
  return !!value && value.length > 0;
}

function getValidGasCost(state: AppState) {
  const gasCost = getGasCost(state);
  const etherBalance = getEtherBalance(state);
  const isOffline = getOffline(state);
  if (isOffline || !etherBalance) {
    return true;
  }
  return gasCost.lte(etherBalance);
}

export {
  getData,
  getFields,
  getGasLimit,
  getValue,
  getTo,
  getNonce,
  getGasPrice,
  getDataExists,
  getValidGasCost
};
