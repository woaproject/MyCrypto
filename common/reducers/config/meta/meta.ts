import { ChangeLanguageAction, SetLatestBlockAction, MetaAction } from 'actions/config';
import { TypeKeys } from 'actions/config/constants';
import {
  BalancerNetworkSwitchRequestedAction,
  TypeKeys as NodeBalancerTypeKeys,
  NodeBalancerAction
} from 'actions/nodeBalancer';

export interface State {
  languageSelection: string;
  offline: boolean;
  autoGasLimit: boolean;
  latestBlock: string;
}

const INITIAL_STATE: State = {
  languageSelection: 'en',
  offline: false,
  autoGasLimit: true,
  latestBlock: '???'
};

function handleNetworkSwitchRequested(state: State, _: BalancerNetworkSwitchRequestedAction) {
  return {
    ...state,
    offline: true
  };
}

function changeLanguage(state: State, action: ChangeLanguageAction): State {
  return {
    ...state,
    languageSelection: action.payload
  };
}

function toggleOffline(state: State): State {
  return {
    ...state,
    offline: !state.offline
  };
}

function toggleAutoGasLimitEstimation(state: State): State {
  return {
    ...state,
    autoGasLimit: !state.autoGasLimit
  };
}

function setLatestBlock(state: State, action: SetLatestBlockAction): State {
  return {
    ...state,
    latestBlock: action.payload
  };
}

export function meta(state: State = INITIAL_STATE, action: MetaAction | NodeBalancerAction): State {
  switch (action.type) {
    case TypeKeys.CONFIG_LANGUAGE_CHANGE:
      return changeLanguage(state, action);

    case TypeKeys.CONFIG_TOGGLE_OFFLINE:
      return toggleOffline(state);

    case TypeKeys.CONFIG_TOGGLE_AUTO_GAS_LIMIT:
      return toggleAutoGasLimitEstimation(state);

    case TypeKeys.CONFIG_SET_LATEST_BLOCK:
      return setLatestBlock(state, action);

    case NodeBalancerTypeKeys.BALANCER_NETWORK_SWTICH_REQUESTED:
      return handleNetworkSwitchRequested(state, action);
    default:
      return state;
  }
}
