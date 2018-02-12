import { TypeKeys } from './constants';
import { Task } from 'redux-saga';
import { INodeStats } from 'reducers/nodeBalancer/nodes';
import { StaticNodeId } from 'types/node';
import { State as NodeBalancerState } from 'reducers/nodeBalancer';

export type AllNodeIds = StaticNodeId | string;

export interface NodeCall {
  callId: number;
  rpcMethod: string;
  rpcArgs: string[];
  numOfTimeouts: number;
  minPriorityNodeList: AllNodeIds[];
  nodeWhiteList?: AllNodeIds[];
}

export interface BalancerFlushAction {
  type: TypeKeys.BALANCER_FLUSH;
}

export interface NodeOnlineAction {
  type: TypeKeys.NODE_ONLINE;
  payload: {
    nodeId: AllNodeIds;
  };
}

export interface NodeOfflineAction {
  type: TypeKeys.NODE_OFFLINE;
  payload: {
    nodeId: AllNodeIds;
  };
}

export interface NodeAddedAction {
  type: TypeKeys.NODE_ADDED;
  payload: {
    nodeId: AllNodeIds;
  } & INodeStats;
}

export interface NodeRemovedAction {
  type: TypeKeys.NODE_REMOVED;
  payload: { nodeId: AllNodeIds };
}

export interface WorkerSpawnedAction {
  type: TypeKeys.WORKER_SPAWNED;
  payload: {
    nodeId: AllNodeIds;
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

export interface BalancerNetworkSwitchRequestedAction {
  type: TypeKeys.BALANCER_NETWORK_SWTICH_REQUESTED;
}

export interface NetworkSwitchSucceededAction {
  type: TypeKeys.BALANCER_NETWORK_SWITCH_SUCCEEDED;
  payload: {
    nodeStats: NodeBalancerState['nodes'];
    workers: NodeBalancerState['workers'];
  };
}

export interface WorkerKilledAction {
  type: TypeKeys.WORKER_KILLED;
  payload: {
    nodeId: AllNodeIds;
    workerId: string;
    error: Error;
  };
}

export interface NodeCallRequestedAction {
  type: TypeKeys.NODE_CALL_REQUESTED;
  payload: NodeCall;
}

export interface NodeCallTimeoutAction {
  type: TypeKeys.NODE_CALL_TIMEOUT;
  payload: NodeCall & { nodeId: AllNodeIds; error: Error };
}

export interface NodeCallFailedAction {
  type: TypeKeys.NODE_CALL_FAILED;
  payload: { error: string; nodeCall: NodeCall };
}

export interface NodeCallSucceededAction {
  type: TypeKeys.NODE_CALL_SUCCEEDED;
  payload: { result: string; nodeCall: NodeCall };
}

export interface BalancerAutoAction {
  type: TypeKeys.BALANCER_AUTO;
}

export interface BalancerManualAction {
  type: TypeKeys.BALANCER_MANUAL;
  payload: { nodeId: string };
}

export type BalancerAction =
  | BalancerFlushAction
  | BalancerAutoAction
  | BalancerManualAction
  | BalancerNetworkSwitchRequestedAction
  | NetworkSwitchSucceededAction;

export type NodeAction = NodeOnlineAction | NodeOfflineAction | NodeAddedAction | NodeRemovedAction;

export type NodeCallAction =
  | NodeCallRequestedAction
  | NodeCallTimeoutAction
  | NodeCallFailedAction
  | NodeCallSucceededAction;

export type WorkerAction = WorkerSpawnedAction | WorkerProcessingAction | WorkerKilledAction;

export type NodeBalancerAction = NodeAction | NodeCallAction | WorkerAction | BalancerAction;
