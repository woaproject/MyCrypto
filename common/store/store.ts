import throttle from 'lodash/throttle';
import { routerMiddleware } from 'react-router-redux';
import {
  INITIAL_STATE as transactionInitialState,
  State as TransactionState
} from 'reducers/transaction';
import { State as SwapState, INITIAL_STATE as swapInitialState } from 'reducers/swap';
import { applyMiddleware, createStore, Store, GenericStoreEnhancer } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { loadStatePropertyOrEmptyObject, saveState } from 'utils/localStorage';
import RootReducer, { AppState } from 'reducers';
import sagas from 'sagas';
import { gasPricetoBase } from 'libs/units';
import {
  rehydrateConfigAndCustomTokenState,
  getConfigAndCustomTokensStateToSubscribe
} from './configAndTokens';

const configureStore = () => {
  const logger = createLogger({
    collapsed: true
  });
  const sagaMiddleware = createSagaMiddleware();
  let middleware: GenericStoreEnhancer;

  if (process.env.NODE_ENV !== 'production') {
    middleware = composeWithDevTools(
      applyMiddleware(sagaMiddleware, logger, routerMiddleware(history as any))
    );
  } else {
    middleware = applyMiddleware(sagaMiddleware, routerMiddleware(history as any));
  }

  const localSwapState = loadStatePropertyOrEmptyObject<SwapState>('swap');
  const swapState =
    localSwapState && localSwapState.step === 3
      ? {
          ...swapInitialState,
          ...localSwapState
        }
      : { ...swapInitialState };

  const savedTransactionState = loadStatePropertyOrEmptyObject<TransactionState>('transaction');

  const persistedInitialState = {
    transaction: {
      ...transactionInitialState,
      fields: {
        ...transactionInitialState.fields,
        gasPrice:
          savedTransactionState && savedTransactionState.fields.gasPrice
            ? {
                raw: savedTransactionState.fields.gasPrice.raw,
                value: gasPricetoBase(+savedTransactionState.fields.gasPrice.raw)
              }
            : transactionInitialState.fields.gasPrice
      }
    },

    // ONLY LOAD SWAP STATE FROM LOCAL STORAGE IF STEP WAS 3
    swap: swapState,
    ...rehydrateConfigAndCustomTokenState()
  };

  const store: Store<AppState> = createStore(
    RootReducer,
    // TODO: Remove this once Redux is updated to allow partial states
    // Should be in the next version bump (> 3.7.2)
    (persistedInitialState as any) as AppState,
    middleware
  );

  // Add all of the sagas to the middleware
  Object.keys(sagas).forEach(saga => {
    sagaMiddleware.run(sagas[saga]);
  });

  store.subscribe(
    throttle(() => {
      const state = store.getState();
      saveState({
        transaction: {
          fields: {
            gasPrice: state.transaction.fields.gasPrice
          }
        },
        swap: {
          ...state.swap,
          options: {
            byId: {},
            allIds: []
          },
          bityRates: {
            byId: {},
            allIds: []
          },
          shapeshiftRates: {
            byId: {},
            allIds: []
          }
        },
        ...getConfigAndCustomTokensStateToSubscribe(state)
      });
    }, 50)
  );

  return store;
};

export const configuredStore = configureStore();
