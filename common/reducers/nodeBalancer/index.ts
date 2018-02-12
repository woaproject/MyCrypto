import { nodes, State as NodeState } from './nodes';
import { State as WorkerState, workers } from './workers';
import { State as BalancerConfigState, balancerConfig } from './balancerConfig';
import { combineReducers } from 'redux';

export interface State {
  nodes: NodeState;
  workers: WorkerState;
  balancerConfig: BalancerConfigState;
}

export const nodeBalancer = combineReducers({
  nodes,
  workers,
  balancerConfig
});
