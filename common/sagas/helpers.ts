import { delay as RDelay, SagaIterator } from 'redux-saga';
import { apply, all, call } from 'redux-saga/effects';

type Func1<T1> = (arg1: T1) => any;

export function* request<T1>(
  context: any,
  fn: Func1<T1>,
  args: [T1],
  delay: number = 500
): SagaIterator {
  const [result] = yield all([apply(context, fn, args), call(RDelay, delay)]);
  return result;
}
