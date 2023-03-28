import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import teaReducer from './teaReducer';
import transactionReducer from './transactionReducer';

// const rootReducer = combineReducers({
//   teas: teaReducer,
//   transactions: transactionReducer
// });

const rootReducer = (state = {}, action) => {
  return {
    teas: teaReducer(state.teas, action),
    transactions: transactionReducer(state.transactions, action)
  };
};

const thunkMW = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }

  return next(action);
};

const loggerMW = (store) => (next) => (action) => {
  // previous state.
  console.log(store.getState());
  console.log(action);
  next(action);
  // next state.
  return console.log(store.getState());
};

function configureStore(preloadedState = {}) {
  return (
    createStore(rootReducer, preloadedState, applyMiddleware(thunkMW, logger))
  );
}

export default configureStore;