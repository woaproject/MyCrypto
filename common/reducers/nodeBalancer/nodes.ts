import RpcNode from 'libs/nodes/rpc';
import { Reducer } from 'redux';
import {
  NodeOnlineAction,
  NodeOfflineAction,
  NodeAddedAction,
  NodeCallTimeoutAction,
  WorkerKilledAction,
  WorkerSpawnedAction,
  NodeAction,
  WorkerAction,
  NodeCallAction,
  BalancerFlushAction,
  BalancerAction,
  NodeRemovedAction,
  NetworkSwitchRequestedAction,
  NetworkSwitchSucceededAction
} from 'actions/nodeBalancer';
import { TypeKeys } from 'actions/nodeBalancer/constants';
import { configuredStore } from 'store';
import { getNodeConfig } from 'selectors/config';

export interface INodeStats {
  isCustom: boolean;
  maxWorkers: number;
  currWorkersById: string[];
  timeoutThresholdMs: number;
  isOffline: boolean;
  requestFailures: number;
  requestFailureThreshold: number;
  avgResponseTime: number;
  supportedMethods: { [rpcMethod in keyof RpcNode]: boolean };
}

export interface State {
  [nodeId: string]: Readonly<INodeStats>;
}

// hard code in the nodes for now
const INITIAL_STATE: State = {};

const handleNetworkSwitch: Reducer<State> = (
  _: State,
  { payload: { nodeStats } }: NetworkSwitchSucceededAction
) => nodeStats;

const handleWorkerKilled: Reducer<State> = (
  state: State,
  { payload: { nodeId, workerId } }: WorkerKilledAction
) => {
  const nodeToChange = state[nodeId];
  const nextNodeState = {
    ...nodeToChange,
    currWorkersById: nodeToChange.currWorkersById.filter(id => id !== workerId)
  };
  return { ...state, [nodeId]: nextNodeState };
};

const handleWorkerSpawned: Reducer<State> = (
  state: State,
  { payload: { nodeId, workerId } }: WorkerSpawnedAction
) => {
  const nodeToChange = state[nodeId];
  const nextNodeState = {
    ...nodeToChange,
    currWorkersById: [...nodeToChange.currWorkersById, workerId]
  };
  return { ...state, [nodeId]: nextNodeState };
};

const handleNodeOnline: Reducer<State> = (
  state: State,
  { payload: { nodeId } }: NodeOnlineAction
) => ({
  ...state,
  [nodeId]: {
    ...state[nodeId],
    isOffline: false
  }
});

const handleNodeOffline: Reducer<State> = (
  state: State,
  { payload: { nodeId } }: NodeOfflineAction
) => ({
  ...state,
  [nodeId]: {
    ...state[nodeId],
    isOffline: true,
    requestFailures: 0
  }
});

const handleNodeAdded: Reducer<State> = (
  state: State,
  { payload: { nodeId, ...nodeStats } }: NodeAddedAction
) => ({ ...state, [nodeId]: { ...nodeStats } });

const handleNodeRemoved: Reducer<State> = (state: State, { payload }: NodeRemovedAction) => {
  const stateCopy = { ...state };
  Reflect.deleteProperty(state, payload.nodeId);
  return stateCopy;
};

const handleNodeCallTimeout: Reducer<State> = (
  state: State,
  { payload: { nodeId } }: NodeCallTimeoutAction
) => ({
  ...state,
  [nodeId]: {
    ...state[nodeId],
    requestFailures: state[nodeId].requestFailures + 1
  }
});

const handleBalancerFlush: Reducer<State> = (state: State, _: BalancerFlushAction) =>
  Object.entries(state).reduce(
    (obj, [nodeId, nodeStats]) => ({ ...obj, [nodeId]: { ...nodeStats, requestFailures: 0 } }),
    {} as State
  );

export const nodes: Reducer<State> = (
  state: State = INITIAL_STATE,
  action: NodeAction | WorkerAction | NodeCallAction | BalancerAction
): State => {
  switch (action.type) {
    case TypeKeys.WORKER_KILLED:
      return handleWorkerKilled(state, action);
    case TypeKeys.WORKER_SPAWNED:
      return handleWorkerSpawned(state, action);
    case TypeKeys.NODE_ONLINE:
      return handleNodeOnline(state, action);
    case TypeKeys.NODE_OFFLINE:
      return handleNodeOffline(state, action);
    case TypeKeys.NODE_ADDED:
      return handleNodeAdded(state, action);
    case TypeKeys.NODE_REMOVED:
      return handleNodeRemoved(state, action);
    case TypeKeys.NODE_CALL_TIMEOUT:
      return handleNodeCallTimeout(state, action);
    case TypeKeys.BALANCER_FLUSH:
      return handleBalancerFlush(state, action);

    case TypeKeys.NETWORK_SWITCH_SUCCEEDED:
      return handleNetworkSwitch(state, action);
    default:
      return state;
  }
};
