import { delay, SagaIterator, buffers, channel, Task, Channel } from 'redux-saga';
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
  flush
} from 'redux-saga/effects';
import { nodeCallRequested } from 'actions/nodeBalancer';

interface IChannels {
  [key: string]: Channel<IPayload>;
}

function* handleRequest(node, chan) {
  let currentPayload;
  while (true) {
    try {
      const { payload } = yield take(chan);
      currentPayload = payload;
      const result = yield race({
        result: apply(node, node[payload.methodName], payload.methodArgs),
        timeout: call(delay, node.timeout)
      });

      if (result.timeout) {
        throw Error();
      }

      yield put(result.result, payload.id);
    } catch {
      const beyondTimeout = yield select(timeoutCounter, node);
      if (beyondTimeout) {
        const payload = {
          type: 'NODE_DOWN',
          payload: { node, payload: currentPayload }
        };
        return yield put(payload);
      } else {
        const payload = {
          type: 'NODE_TIMEOUT',
          payload: { node, payload: currentPayload }
        };
        return yield put(payload);
      }
    }
  }
}

// both nodes and requests may have independent retry counters
// on task cancellation, dispatch a fail action
// on channel flush, dispatch a fail action for all flushed actions

function* initAndChannelNodePool(): SagaIterator {
  const availableNodes = yield select(getAvailableNodes);
  const getChannelTypes = yield select(getChannelTypes);
  const channels: IChannels = {};
  const tasks: Task[] = [];

  for (const node of availableNodes) {
    const c: Channel<any> = yield call(channel, buffers.expanding(10));
    const t: Task = yield spawn(handleRequest, node, c);
    tasks.push(t);
    channels[node] = c;
  }

  yield put('NODE_POOL_INIT', tasks);
  return tasks;
}

function* handleNodeStatusChanges(chan) {
  while (true) {
    const { payload } = yield take('NODE_DOWN' | 'NODE_TIMEOUT' | 'NODE_ONLINE');
    const { node } = payload;
    const nodeStatus = yield select(getNodeStatus(node));

    if (nodeStatus.timedOut) {
      yield call(delay, 2000);
      yield spawn(handleRequest, node, chan);
    }

    if (nodeStatus.online) {
      const task = yield spawn(handleRequest, node, chan);
      yield put('NODE_SPAWNED', task);
    }

    if (nodeStatus.offline) {
      yield fork(pollOffline, node);

      const availableNode = yield select(getAvailableNode);

      if (availableNode) {
        yield spawn(handleRequest, availableNode, chan);
      }

      const allNodesDown = yield select(getIsAllNodesDown);

      if (allNodesDown) {
        yield put('FLUSH_REQUESTS');
      }
    }
    // make sure to keep the same ID
    yield put('NETWORK_REQUEST');
  }
}

function* flushHandler(chan): SagaIterator {
  let tasks: Task[] = [];
  while (true) {
    const { node, shouldFlush } = yield race({
      node: take('NODE_SPAWNED', 'NODE_POOL_INIT'),
      shouldFlush: take('FLUSH_REQUESTS')
    });

    if (shouldFlush) {
      yield cancel(...tasks);
      yield flush(chan);
      tasks = [];
    } else {
      tasks.push(node);
    }
  }
}

function* pollOffline(node) {
  while (true) {
    const isOffline = yield call(node, ping);
    if (!isOffline) {
      yield put({ type: 'NODE_ONLINE', payload: node });
    }
    yield call(delay, 2000);
  }
}

function* managerNodePool(): SagaIterator {
  const chan = yield call(channel, buffers.expanding(15));

  const channels = yield initAndChannelNodePool(chan);

  yield fork(function*() {
    while (true) {
      const { payload } = yield take('NETWORK_REQUEST');
      yield put(chan, payload);
    }
  });
  yield fork(handleNodeStatusChanges, chan);
  yield fork(flushHandler, chan);
}

export const requester = name =>
  function*(args) {
    const networkReq = makeNetworkRequest(name, args);
    console.log(networkReq);
    yield put(networkReq);
    const { res } = yield take(
      action => action.type === 'NETWORK_SUCCESS' && action.id === networkReq.payload.id
    );
    return res;
  };

const node = [fork(managerNodePool)];
