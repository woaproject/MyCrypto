import { TypeKeys, ChangeNetworkAction, NetworkAction } from 'actions/config';
import { StaticNetworkIds } from 'types/network';

export type State = StaticNetworkIds;

const INITIAL_STATE: State = 'ETH';

const handleNetworkChange = (_: State, { payload }: ChangeNetworkAction) => payload.networkId;

export const selectedNetwork = (state: State = INITIAL_STATE, action: NetworkAction) => {
  switch (action.type) {
    case TypeKeys.CONFIG_NETWORK_CHANGE:
      return handleNetworkChange(state, action);
    default:
      return state;
  }
};
