import { Task } from 'redux-saga';
import {
  AllNodeNames,
  NodeCall,
  WorkerKilledAction,
  WorkerProcessingAction,
  WorkerSpawnedAction,
  NodeCallSucceededAction,
  WorkerAction,
  NodeCallAction
} from 'actions/nodeBalancer';
import { Reducer } from 'redux';
import { TypeKeys } from 'actions/nodeBalancer/constants';

interface IWorker {
  task: Task;
  assignedNode: AllNodeNames;
  currentPayload: NodeCall | null;
}

export interface State {
  [key: string]: Readonly<IWorker>;
}

const INITIAL_STATE = {};

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
  [payload.workerId]: { assignedNode: payload.nodeName, task: payload.task, currentPayload: null }
});

const handleNodeCallSucceeded: Reducer<State> = (
  state: State,
  { payload: { callId } }: NodeCallSucceededAction
) => {
  const workerIdToRemove = Object.entries(state).find(
    ([_, { currentPayload }]) => (currentPayload ? currentPayload.callId === callId : false)
  );

  console.assert(
    workerIdToRemove,
    'WorkerID not found for successful payload, this should never happen'
  );
  if (!workerIdToRemove) {
    throw Error();
  }

  const stateCopy = { ...state };
  Reflect.deleteProperty(stateCopy, workerIdToRemove[0]);

  return stateCopy;
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
    default:
      return state;
  }
};
