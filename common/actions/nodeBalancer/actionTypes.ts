import { TypeKeys } from './constants';
import { DefaultNodeNames } from 'config/data';
import { Task } from 'redux-saga';
import { INodeStats } from 'reducers/nodeBalancer/nodes';

export type AllNodeNames = DefaultNodeNames | string;

export interface NodeCall {
  callId: number;
  rpcMethod: string;
  rpcArgs: string[];
  numOfTimeouts: number;
  nodeWhiteList?: AllNodeNames;
}

export interface BalancerFlushAction {
  type: TypeKeys.BALANCER_FLUSH;
}

export interface NodeOnlineAction {
  type: TypeKeys.NODE_ONLINE;
  payload: {
    nodeName: AllNodeNames;
  };
}

export interface NodeOfflineAction {
  type: TypeKeys.NODE_OFFLINE;
  payload: {
    nodeName: AllNodeNames;
  };
}

// this is for when new nodes get added dynamically
export interface NodeAddedAction {
  type: TypeKeys.NODE_ADDED;
  payload: {
    nodeName: AllNodeNames;
  } & INodeStats;
}

export interface NodeRemovedAction {
  type: TypeKeys.NODE_REMOVED;
  payload: { nodeName: AllNodeNames };
}

export interface WorkerSpawnedAction {
  type: TypeKeys.WORKER_SPAWNED;
  payload: {
    nodeName: AllNodeNames;
    workerId: string;
    task: Task;
  };
}

export interface WorkerProcessingAction {
  type: TypeKeys.WORKER_PROCESSING;
  payload: {
    workerId: string;
    currentPayload: NodeCall;
  };
}

export interface WorkerKilledAction {
  type: TypeKeys.WORKER_KILLED;
  payload: {
    nodeName: AllNodeNames;
    workerId: string;
  };
}

export interface NodeCallRequestedAction {
  type: TypeKeys.NODE_CALL_REQUESTED;
  payload: NodeCall;
}

export interface NodeCallTimeoutAction {
  type: TypeKeys.NODE_CALL_TIMEOUT;
  payload: NodeCall & { nodeName: AllNodeNames };
}

export interface NodeCallFailedAction {
  type: TypeKeys.NODE_CALL_FAILED;
  payload: NodeCall;
}

export interface NodeCallSucceededAction {
  type: TypeKeys.NODE_CALL_SUCCEEDED;
  payload: NodeCall;
}

export type BalancerAction = BalancerFlushAction;

export type NodeAction = NodeOnlineAction | NodeOfflineAction | NodeAddedAction | NodeRemovedAction;

export type NodeCallAction =
  | NodeCallRequestedAction
  | NodeCallTimeoutAction
  | NodeCallFailedAction
  | NodeCallSucceededAction;

export type WorkerAction = WorkerSpawnedAction | WorkerProcessingAction | WorkerKilledAction;

export type NodeBalancerAction = NodeAction | NodeCallAction | WorkerAction | BalancerAction;
