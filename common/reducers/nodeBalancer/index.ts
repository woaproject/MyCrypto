import { nodes, State as NodeState } from './nodes';
import { State as WorkerState, workers } from './workers';
import { combineReducers } from 'redux';

export interface State {
  nodes: NodeState;
  workers: WorkerState;
}

export const nodeBalancer = combineReducers({ nodes, workers });
