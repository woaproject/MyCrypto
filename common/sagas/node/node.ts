import { delay, SagaIterator, buffers, channel, Task, Channel, takeEvery } from 'redux-saga';
import {
  call,
  cancel,
  fork,
  put,
  take,
  select,
  race,
  apply,
  spawn,
  flush,
  all,
  actionChannel
} from 'redux-saga/effects';
import {
  nodeCallRequested,
  NodeCall,
  workerSpawned,
  NodeCallRequestedAction,
  nodeCallSucceeded,
  workerProcessing,
  TypeKeys,
  NodeCallSucceededAction,
  NodeCallFailedAction,
  nodeOffline,
  nodeCallFailed,
  nodeCallTimeout,
  NodeCallTimeoutAction,
  NodeOfflineAction,
  nodeOnline,
  BalancerFlushAction
} from 'actions/nodeBalancer';
import {
  getAvailableNodes,
  AvailableNodes,
  getNodeStatsById,
  getAllMethodsAvailable,
  getAvailableNodeId
} from 'selectors/nodeBalancer';
import { getOffline, getNodeById } from 'selectors/config';
import { toggleOffline } from 'actions/config';
import { StaticNodeConfig, CustomNodeConfig, NodeConfig } from '../../../shared/types/node';
import { INodeStats } from 'reducers/nodeBalancer/nodes';

// need to check this arbitary number
const MAX_NODE_CALL_TIMEOUTS = 3;

/**
 *  For now we're going to hard code the initial node configuration in,
 *  ideally on initialization, a ping call gets sent to every node in the current network
 *  to determine which nodes are offline on app start using 'NodeAdded'
 *  then spawn workers for each node from there using 'WorkerSpawned'
 *
 */

/**
 * Each channel id is a 1-1 mapping of a nodeId
 */
interface IChannels {
  [key: string]: Channel<NodeCall>;
}

const channels: IChannels = {};

function* initAndChannelNodePool(): SagaIterator {
  console.log('Initializing channel and node pool started');
  const availableNodes: AvailableNodes = yield select(getAvailableNodes);
  const availableNodesArr = Object.entries(availableNodes);

  // if there are no available nodes during the initialization, put the app in an offline state
  if (availableNodesArr.length === 0) {
    const isOffline: boolean = yield select(getOffline);
    if (!isOffline) {
      yield put(toggleOffline());
    }
  }

  // make a channel per available node and init its workers up to the maxiumum allowed workers
  for (const [nodeId, nodeConfig] of availableNodesArr) {
    const nodeChannel: Channel<NodeCall> = yield call(channel, buffers.expanding(10));
    channels[nodeId] = nodeChannel;

    for (
      let workerNumber = nodeConfig.currWorkersById.length;
      workerNumber < nodeConfig.maxWorkers;
      workerNumber++
    ) {
      const workerId = `${nodeId}_worker_${workerNumber}`;
      const workerTask: Task = yield spawn(spawnWorker, workerId, nodeId, nodeChannel);
      console.log(`Worker ${workerId} spawned for ${nodeId}`);
      yield put(workerSpawned({ nodeId, workerId, task: workerTask }));
    }
  }
  console.log('Initializing channel and node pool finished');
}

function* handleNodeCallRequests(): SagaIterator {
  const requestChan = yield actionChannel(TypeKeys.NODE_CALL_REQUESTED);
  while (true) {
    const { payload }: NodeCallRequestedAction = yield take(requestChan);
    // check if the app is offline

    // wait until its back online

    // get an available nodeId to put the action to the channel
    const nodeId: string = yield select(getAvailableNodeId, payload);
    const nodeChannel = channels[nodeId];
    yield put(nodeChannel, payload);
  }
}

function* handleCallTimeouts({
  payload: { error, nodeId, ...nodeCall }
}: NodeCallTimeoutAction): SagaIterator {
  const nodeStats: Readonly<INodeStats> | undefined = yield select(getNodeStatsById, nodeId);
  if (!nodeStats) {
    throw Error('Could not find node stats');
  }
  // if the node has reached maximum failures, declare it as offline
  if (nodeStats.requestFailures >= nodeStats.requestFailureThreshold) {
    yield put(nodeOffline({ nodeId }));

    //check if all methods are still available after this node goes down
    const isAllMethodsAvailable: boolean = yield select(getAllMethodsAvailable);
    if (!isAllMethodsAvailable) {
      // if not, set app state offline and flush channels
      const appIsOffline: boolean = yield select(getOffline);
      if (!appIsOffline) {
        yield put(toggleOffline());
      }
    }
  }

  // if the payload exceeds timeout limits, return a response failure
  if (nodeCall.numOfTimeouts > MAX_NODE_CALL_TIMEOUTS) {
    yield put(nodeCallFailed({ error: error.message, nodeCall }));
  } else {
    // else consider it a timeout on the request to be retried
    // might want to make this a seperate action
    // add nodeId to min priority to avoid it if possible
    const nextNodeCall: NodeCall = {
      ...nodeCall,
      minPriorityNodeList: [...nodeCall.minPriorityNodeList, nodeId],
      numOfTimeouts: ++nodeCall.numOfTimeouts
    };
    yield put(nodeCallRequested(nextNodeCall));
  }
}

function* watchOfflineNode({ payload: { nodeId } }: NodeOfflineAction) {
  const nodeConfig: NodeConfig = yield select(getNodeById, nodeId);
  while (true) {
    try {
      console.log(`Polling ${nodeId} to see if its online...`);
      const { lb } = yield race({
        lb: apply(nodeConfig.pLib, nodeConfig.pLib.getCurrentBlock),
        to: call(delay, 5000)
      });
      if (lb) {
        console.log(`${nodeId} online!`);
        yield put(nodeOnline({ nodeId }));

        // check if all methods are available after this node is online
        const isAllMethodsAvailable: boolean = yield select(getAllMethodsAvailable);

        // if they are, put app in online state
        if (isAllMethodsAvailable) {
          const appIsOffline: boolean = yield select(getOffline);
          if (appIsOffline) {
            yield put(toggleOffline());
          }
        }
      }
    } catch (error) {
      yield call(delay, 5000);
      console.info(error);
    }

    console.log(`${nodeId} still offline`);
  }
}

function* spawnWorker(thisId: string, nodeId: string, chan: IChannels[string]) {
  /**
   * @description used to differentiate between errors from worker code vs a network call error
   * @param message
   */
  const createInternalError = (message: string) => {
    const e = Error(message);
    e.name = 'InternalError';
    return e;
  };

  //select the node config on initialization to avoid re-selecting on every request handled
  const nodeConfig: StaticNodeConfig | CustomNodeConfig | undefined = yield select(
    getNodeById,
    nodeId
  );
  if (!nodeConfig) {
    throw Error(`Node ${nodeId} not found when selecting from state`);
  }

  let currentPayload: NodeCall;
  while (true) {
    try {
      // take from the assigned action channel
      const payload: NodeCall = yield take(chan);
      currentPayload = payload;
      // after taking a request, declare processing state
      yield put(workerProcessing({ currentPayload: payload, workerId: thisId }));

      const nodeStats: Readonly<INodeStats> | undefined = yield select(getNodeStatsById, nodeId);

      if (!nodeStats) {
        throw createInternalError(`Could not find stats for node ${nodeId}`);
      }

      const lib = nodeConfig.pLib;

      // make the call in the allotted timeout time
      // this will create an infinite loop
      const { result, timeout } = yield race({
        result: apply(lib, lib[payload.rpcMethod], payload.rpcArgs),
        timeout: call(delay, nodeStats.timeoutThresholdMs)
      });

      //TODO: clean this up
      if (timeout || !result) {
        throw createInternalError(`Request timed out for ${nodeId}`);
      }

      yield put(nodeCallSucceeded({ result, nodeCall: payload }));
    } catch (error) {
      const e: Error = error;
      if (!(e.name === 'InternalError')) {
        e.name = `NetworkError_${e.name}`;
      }
      yield put(nodeCallTimeout({ ...currentPayload!, nodeId, error }));
    }
  }
}

export const nodeCallRequester = (() => {
  let callId = 0;
  return (rpcMethod: string) => {
    return function*(...rpcArgs: string[]) {
      // allow all nodes for now
      const nodeCall: NodeCall = {
        callId: ++callId,
        numOfTimeouts: 0,
        rpcArgs,
        rpcMethod,
        minPriorityNodeList: []
      };

      // make the request to the load balancer
      const networkReq = nodeCallRequested(nodeCall);
      console.log(networkReq);
      yield put(networkReq);

      //wait for either a success or error response
      const response: NodeCallSucceededAction | NodeCallFailedAction = yield take(
        (action: NodeCallSucceededAction | NodeCallFailedAction) =>
          (action.type === TypeKeys.NODE_CALL_SUCCEEDED ||
            action.type === TypeKeys.NODE_CALL_FAILED) &&
          action.payload.nodeCall.callId === networkReq.payload.callId
      );

      // return the result as expected
      if (response.type === TypeKeys.NODE_CALL_SUCCEEDED) {
        return response.payload.result;
      } else {
        // or throw an error
        throw Error(response.payload.error);
      }
    };
  };
})();

function* flushHandler(_: BalancerFlushAction): SagaIterator {
  const channelValues = Object.values(channels);
  for (const chan of channelValues) {
    yield flush(chan);
  }
}

export function* nodeBalancer() {
  yield all([
    call(initAndChannelNodePool),
    takeEvery(TypeKeys.NODE_OFFLINE, watchOfflineNode),
    fork(handleNodeCallRequests),
    takeEvery(TypeKeys.NODE_CALL_TIMEOUT, handleCallTimeouts),
    takeEvery(TypeKeys.BALANCER_FLUSH, flushHandler)
  ]);
}
