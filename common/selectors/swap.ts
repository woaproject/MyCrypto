import { AppState } from 'reducers';

const getSwap = (state: AppState) => state.swap;

export function getOrigin(state: AppState) {
  return getSwap(state).origin;
}
export function getPaymentAddress(state: AppState) {
  return getSwap(state).paymentAddress;
}
export function shouldDisplayLiteSend(state: AppState) {
  return getSwap(state).showLiteSend;
}
