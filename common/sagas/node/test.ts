export function channel(buffer = buffers.expanding()) {
  let closed = false;
  let takers = [];

  if (process.env.NODE_ENV === 'development') {
    check(buffer, is.buffer, INVALID_BUFFER);
  }

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr('Cannot have a closed channel with pending takers');
    }
    if (takers.length && !buffer.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    checkForbiddenStates();

    if (process.env.NODE_ENV === 'development') {
      check(input, is.notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }
    if (!takers.length) {
      return buffer.put(input);
    }
    const cb = takers[0];
    takers.splice(0, 1);
    cb(input);
  }

  function take(cb) {
    checkForbiddenStates();

    if (process.env.NODE_ENV === 'development') {
      check(cb, is.func, "channel.take's callback must be a function");
    }

    if (closed && buffer.isEmpty()) {
      cb(END);
    } else if (!buffer.isEmpty()) {
      cb(buffer.take());
    } else {
      takers.push(cb);
      cb.cancel = () => remove(takers, cb);
    }
  }

  function flush(cb) {
    checkForbiddenStates(); // TODO: check if some new state should be forbidden now

    if (process.env.NODE_ENV === 'development') {
      check(cb, is.func, "channel.flush' callback must be a function");
    }

    if (closed && buffer.isEmpty()) {
      cb(END);
      return;
    }
    cb(buffer.flush());
  }

  function close() {
    checkForbiddenStates();
    if (!closed) {
      closed = true;
      if (takers.length) {
        const arr = takers;
        takers = [];
        for (let i = 0, len = arr.length; i < len; i++) {
          const taker = arr[i];
          taker(END);
        }
      }
    }
  }

  return {
    take,
    put,
    flush,
    close
  };
}
