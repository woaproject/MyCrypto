import { TypeKeys } from 'actions/nodeBalancer/constants';
import { Reducer } from 'redux';
import { BalancerAction, BalancerAutoAction } from 'actions/nodeBalancer';

export interface State {
  manual: boolean;
  offline: boolean;
}

const INITIAL_STATE: State = {
  manual: false,
  offline: false
};

const handleBalancerAuto: Reducer<State> = (state: State, _: BalancerAutoAction) => ({
  ...state,
  manual: false
});
const handleBalancerManual: Reducer<State> = (state: State, _: BalancerAutoAction) => ({
  ...state,
  manual: true
});

export const balancerConfig: Reducer<State> = (
  state: State = INITIAL_STATE,
  action: BalancerAction
): State => {
  switch (action.type) {
    case TypeKeys.BALANCER_AUTO:
      return handleBalancerAuto(state, action);
    case TypeKeys.BALANCER_MANUAL:
      return handleBalancerManual(state, action);
    default:
      return state;
  }
};
