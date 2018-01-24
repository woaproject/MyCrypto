import { AppState } from 'reducers';
import { getTransactionState } from 'selectors/transaction';
import { RequestStatus } from 'reducers/transaction/network';

export function getNetworkStatus(state: AppState) {
  return getTransactionState(state).network;
}

export function nonceRequestFailed(state: AppState) {
  return getNetworkStatus(state).getNonceStatus === RequestStatus.FAILED;
}

export function isNetworkRequestPending(state: AppState) {
  const network = getNetworkStatus(state);
  const states: RequestStatus[] = Object.values(network);
  return states.reduce(
    (anyPending, currRequestState) => anyPending || currRequestState === RequestStatus.REQUESTED,
    false
  );
}

export function getGasEstimationPending(state: AppState) {
  return getNetworkStatus(state).gasEstimationStatus === RequestStatus.REQUESTED;
}

export function getGasLimitEstimationTimedOut(state: AppState) {
  return getNetworkStatus(state).gasEstimationStatus === RequestStatus.TIMEDOUT;
}
