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
  NodeRemovedAction
} from 'actions/nodeBalancer';
import { TypeKeys } from 'actions/nodeBalancer/constants';

export interface INodeStats {
  maxWorkers: number;
  currWorkersById: string[];
  timeoutThreshold: number;
  isOffline: boolean;
  requestFailures: number;
  requestFailureThreshold: number;
  avgResponseTime: number;
  supportedMethods: (keyof RpcNode)[];
}

export interface State {
  [key: string]: Readonly<INodeStats>;
}

//  handle custom node removal

const INITIAL_STATE = {};

const handleWorkerKilled: Reducer<State> = (
  state: State,
  { payload: { nodeName, workerId } }: WorkerKilledAction
) => {
  const nodeToChange = state[nodeName];
  const nextNodeState = {
    ...nodeToChange,
    currWorkersById: nodeToChange.currWorkersById.filter(id => id !== workerId)
  };
  return { ...state, [nodeName]: nextNodeState };
};

const handleWorkerSpawned: Reducer<State> = (
  state: State,
  { payload: { nodeName, workerId } }: WorkerSpawnedAction
) => {
  const nodeToChange = state[nodeName];
  const nextNodeState = {
    ...nodeToChange,
    currWorkersById: [...nodeToChange.currWorkersById, workerId]
  };
  return { ...state, [nodeName]: nextNodeState };
};

const handleNodeOnline: Reducer<State> = (
  state: State,
  { payload: { nodeName } }: NodeOnlineAction
) => ({
  ...state,
  [nodeName]: {
    ...state[nodeName],
    isOffline: false
  }
});

const handleNodeOffline: Reducer<State> = (
  state: State,
  { payload: { nodeName } }: NodeOfflineAction
) => ({
  ...state,
  [nodeName]: {
    ...state[nodeName],
    isOffline: true,
    requestFailures: 0
  }
});

const handleNodeAdded: Reducer<State> = (
  state: State,
  { payload: { nodeName, ...nodeStats } }: NodeAddedAction
) => ({ ...state, [nodeName]: { ...nodeStats } });

const handleNodeRemoved: Reducer<State> = (state: State, { payload }: NodeRemovedAction) => {
  const stateCopy = { ...state };
  Reflect.deleteProperty(state, payload.nodeName);
  return stateCopy;
};

const handleNodeCallTimeout: Reducer<State> = (
  state: State,
  { payload: { nodeName } }: NodeCallTimeoutAction
) => ({
  ...state,
  [nodeName]: {
    ...state[nodeName],
    requestFailures: state[nodeName].requestFailures + 1
  }
});

const handleBalancerFlush: Reducer<State> = (state: State, _: BalancerFlushAction) =>
  Object.entries(state).reduce(
    (obj, [nodeName, nodeStats]) => ({ ...obj, [nodeName]: { ...nodeStats, requestFailures: 0 } }),
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
    default:
      return state;
  }
};
