import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink, NextLink, split } from 'apollo-client-preset';
import { Operation } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import Expo from 'expo';
import { OperationDefinitionNode } from 'graphql';
import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import AppWithNavigationState, { navigationReducer } from './navigation';
import auth, { ReduxState } from './reducers/auth.reducer';
import {
  AsyncStorage,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { persistStore, persistCombineReducers } from 'redux-persist';
import { PersistGate } from 'redux-persist/es/integration/react';
import { onError } from 'apollo-link-error';
import { logout } from './actions/auth.actions';
import _some from 'lodash-es/some';
import { getUser } from './reducers/auth.reducer';

const reducers = persistCombineReducers<ReduxState>(
  {
    key: '@chatty-native',
    storage: AsyncStorage,
    blacklist: ['nav'],
  },
  {
    auth,
    nav: navigationReducer,
  }
);

const store = createStore<ReduxState>(reducers, composeWithDevTools());
const persistor = persistStore(store);

const API_URL = Expo.Constants.manifest.extra
  ? Expo.Constants.manifest.extra.REACT_NATIVE_APP_API_URL
  : '';

const HTTP_URL = `${API_URL}/graphql`;

const WEBSOCKET_URL = `${API_URL.replace(/https?/, 'ws')}/subscriptions`;

export const wsClient = new SubscriptionClient(WEBSOCKET_URL, {
  reconnect: true,
  connectionParams() {
    return { jwt: getUser(store.getState()).jwt };
  },
  lazy: true,
});

const wsLink = new WebSocketLink(wsClient) as ApolloLink;

let httpLink;

httpLink = new HttpLink({ uri: HTTP_URL }) as ApolloLink;

httpLink = middlewareAuthLink().concat(httpLink);

httpLink = middlewareErrorLink().concat(httpLink);

let link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(
      query
    ) as OperationDefinitionNode;
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink
);

if (process.env.NODE_ENV !== 'production') {
  link = middlewareLoggerLink(link);
}

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export default class App extends React.Component<{}, {}> {
  render() {
    return (
      <Provider store={store}>
        <PersistGate
          persistor={persistor}
          loading={<Loading />}
          onBeforeLift={onBeforeLift}
        >
          <ApolloProvider client={client}>
            <AppWithNavigationState />
          </ApolloProvider>
        </PersistGate>
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'stretch',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
});

function Loading() {
  return (
    <View style={[styles.loading, styles.container]}>
      <ActivityIndicator />
    </View>
  );
}

function onBeforeLift() {
  return undefined;
}

function middlewareAuthLink() {
  return new ApolloLink((operation, forward) => {
    const token = getUser(store.getState()).jwt;

    if (token) {
      operation.setContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
    }

    return forward ? forward(operation) : null;
  });
}

const getNow = () => {
  const n = new Date();
  return `${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}`;
};

function middlewareLoggerLink(l: ApolloLink) {
  const processOperation = (operation: Operation) => ({
    query: operation.query.loc ? operation.query.loc.source.body : {},
    variables: operation.variables,
  });

  const logger = new ApolloLink((operation, forward: NextLink) => {
    const operationName = `Apollo operation: ${operation.operationName}`;

    // tslint:disable-next-line:no-console
    console.log(
      '\n\n\n',
      getNow(),
      `=============================${operationName}========================\n`,
      processOperation(operation),
      `\n=========================End ${operationName}=========================`
    );

    if (!forward) {
      return forward;
    }

    const fop = forward(operation);

    if (fop.map) {
      return fop.map(response => {
        // tslint:disable-next-line:no-console
        console.log(
          '\n\n\n',
          getNow(),
          `==============Received response from ${operationName}============\n`,
          response,
          `\n==========End Received response from ${operationName}=============`
        );
        return response;
      });
    }

    return fop;
  });

  return logger.concat(l);
}

function middlewareErrorLink() {
  return onError(({ graphQLErrors, networkError, response, operation }) => {
    // tslint:disable-next-line:ban-types
    const loggError = (errorName: string, obj: Object) => {
      if (process.env.NODE_ENV === 'production') {
        return;
      }

      const operationName = `[${errorName} error] from Apollo operation: ${
        operation.operationName
      }`;

      // tslint:disable-next-line:no-console
      console.log(
        '\n\n\n',
        getNow(),
        `============================${operationName}=======================\n`,
        obj,
        `\n====================End ${operationName}============================`
      );
    };

    if (response) {
      loggError('Response', response);
    }

    if (networkError) {
      loggError('Network', networkError);
    }

    if (graphQLErrors) {
      loggError('GraphQL', graphQLErrors);

      if (_some(graphQLErrors, { message: 'Unauthorized' })) {
        store.dispatch(logout());
      }
    }
  });
}
