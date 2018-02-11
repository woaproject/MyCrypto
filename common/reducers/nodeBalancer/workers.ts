import { Task } from 'redux-saga';
import {
  AllNodeIds,
  NodeCall,
  WorkerKilledAction,
  WorkerProcessingAction,
  WorkerSpawnedAction,
  NodeCallSucceededAction,
  WorkerAction,
  NodeCallAction,
  NodeCallTimeoutAction
} from 'actions/nodeBalancer';
import { Reducer } from 'redux';
import { TypeKeys } from 'actions/nodeBalancer/constants';

interface IWorker {
  task: Task;
  assignedNode: AllNodeIds;
  currentPayload: NodeCall | null;
}

export interface State {
  [workerId: string]: Readonly<IWorker>;
}

const INITIAL_STATE: State = {};

const handleWorkerKilled: Reducer<State> = (state: State, { payload }: WorkerKilledAction) => {
  const stateCopy = { ...state };
  Reflect.deleteProperty(stateCopy, payload.workerId);
  return stateCopy;
};

const handleWorkerProcessing: Reducer<State> = (
  state: State,
  { payload: { currentPayload, workerId } }: WorkerProcessingAction
) => ({
  ...state,
  [workerId]: { ...state[workerId], currentPayload }
});

const handleWorkerSpawned: Reducer<State> = (state: State, { payload }: WorkerSpawnedAction) => ({
  ...state,
  [payload.workerId]: { assignedNode: payload.nodeId, task: payload.task, currentPayload: null }
});

const handleNodeCallSucceeded: Reducer<State> = (
  state: State,
  { payload }: NodeCallSucceededAction
) => {
  const { nodeCall: { callId } } = payload;
  const worker = Object.entries(state).find(
    ([_, { currentPayload }]) => (currentPayload ? currentPayload.callId === callId : false)
  );
  if (!worker) {
    throw Error(`Worker not found for a successful request, this should never happen`);
  }

  const [workerId, workerInst] = worker;

  return { ...state, [workerId]: { ...workerInst, currentPayload: null } };
};

// This is almost the exact same as the above, abstract it
const handleNodeCallTimeout: Reducer<State> = (
  state: State,
  { payload }: NodeCallTimeoutAction
) => {
  const { callId } = payload;
  const worker = Object.entries(state).find(
    ([_, { currentPayload }]) => (currentPayload ? currentPayload.callId === callId : false)
  );
  if (!worker) {
    throw Error(`Worker not found for a successful request, this should never happen`);
  }

  const [workerId, workerInst] = worker;

  return { ...state, [workerId]: { ...workerInst, currentPayload: null } };
};

export const workers: Reducer<State> = (
  state: State = INITIAL_STATE,
  action: WorkerAction | NodeCallAction
): State => {
  switch (action.type) {
    case TypeKeys.WORKER_SPAWNED:
      return handleWorkerSpawned(state, action);
    case TypeKeys.WORKER_KILLED:
      return handleWorkerKilled(state, action);
    case TypeKeys.WORKER_PROCESSING:
      return handleWorkerProcessing(state, action);
    case TypeKeys.NODE_CALL_SUCCEEDED:
      return handleNodeCallSucceeded(state, action);
    case TypeKeys.NODE_CALL_TIMEOUT:
      return handleNodeCallTimeout(state, action);
    default:
      return state;
  }
};
