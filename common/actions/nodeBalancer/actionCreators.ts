import {
  BalancerFlushAction,
  NodeAddedAction,
  WorkerKilledAction,
  WorkerProcessingAction,
  WorkerSpawnedAction,
  NodeCallFailedAction,
  NodeCallRequestedAction,
  NodeCallSucceededAction,
  NodeCallTimeoutAction,
  NodeOfflineAction,
  NodeOnlineAction,
  NodeRemovedAction,
  TypeKeys,
  NetworkSwitchRequestedAction,
  NetworkSwitchSucceededAction
} from 'actions/nodeBalancer';

export const balancerFlush = (): BalancerFlushAction => ({
  type: TypeKeys.BALANCER_FLUSH
});

export const nodeOnline = (payload: NodeOnlineAction['payload']): NodeOnlineAction => ({
  type: TypeKeys.NODE_ONLINE,
  payload
});

export const nodeOffline = (payload: NodeOfflineAction['payload']): NodeOfflineAction => ({
  type: TypeKeys.NODE_OFFLINE,
  payload
});

export const nodeAdded = (payload: NodeAddedAction['payload']): NodeAddedAction => ({
  type: TypeKeys.NODE_ADDED,
  payload
});

export const nodeRemoved = (payload: NodeRemovedAction['payload']): NodeRemovedAction => ({
  type: TypeKeys.NODE_REMOVED,
  payload
});

export const workerSpawned = (payload: WorkerSpawnedAction['payload']): WorkerSpawnedAction => ({
  type: TypeKeys.WORKER_SPAWNED,
  payload
});

export const workerProcessing = (
  payload: WorkerProcessingAction['payload']
): WorkerProcessingAction => ({
  type: TypeKeys.WORKER_PROCESSING,
  payload
});

export const workerKilled = (payload: WorkerKilledAction['payload']): WorkerKilledAction => ({
  type: TypeKeys.WORKER_KILLED,
  payload
});

export const nodeCallRequested = (
  payload: NodeCallRequestedAction['payload']
): NodeCallRequestedAction => ({
  type: TypeKeys.NODE_CALL_REQUESTED,
  payload: { ...payload }
});

export const nodeCallTimeout = (
  payload: NodeCallTimeoutAction['payload']
): NodeCallTimeoutAction => ({
  type: TypeKeys.NODE_CALL_TIMEOUT,
  payload
});

export const nodeCallFailed = (payload: NodeCallFailedAction['payload']): NodeCallFailedAction => ({
  type: TypeKeys.NODE_CALL_FAILED,
  payload
});

export const nodeCallSucceeded = (
  payload: NodeCallSucceededAction['payload']
): NodeCallSucceededAction => ({
  type: TypeKeys.NODE_CALL_SUCCEEDED,
  payload
});

export const networkSwitchRequested = (): NetworkSwitchRequestedAction => ({
  type: TypeKeys.NETWORK_SWTICH_REQUESTED
});

export const networkSwitchSucceeded = (
  payload: NetworkSwitchSucceededAction['payload']
): NetworkSwitchSucceededAction => ({ type: TypeKeys.NETWORK_SWITCH_SUCCEEDED, payload });
