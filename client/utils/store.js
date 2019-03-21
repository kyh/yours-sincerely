import { createStore, compose, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';

import rootReducer from '../redux/reducers';

// Insert in any middleware we may want to use.
const middlewares = [reduxThunk];

const enhancers = compose(
  typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
    ? window.devToolsExtension && window.devToolsExtension()
    : (f) => f,
);

const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore);

export default (initialState) =>
  createStoreWithMiddleware(rootReducer, initialState, enhancers);
