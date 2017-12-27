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
import { combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import AppWithNavigationState, { navigationReducer } from './navigation';

const store = createStore(
  combineReducers({ nav: navigationReducer }),
  {},
  composeWithDevTools()
);

const API_URL = Expo.Constants.manifest.extra
  ? Expo.Constants.manifest.extra.REACT_NATIVE_APP_API_URL
  : '';

const HTTP_URL = `${API_URL}/graphql`;

const WEBSOCKET_URL = `${API_URL.replace(/https?/, 'ws')}/subscriptions`;

export const wsClient = new SubscriptionClient(WEBSOCKET_URL, {
  reconnect: true,
  connectionParams: {},
});

const wsLink = new WebSocketLink(wsClient) as ApolloLink;

const httpLink = new HttpLink({ uri: HTTP_URL }) as ApolloLink;

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

const processOperation = (operation: Operation) => ({
  query: operation.query.loc ? operation.query.loc.source.body : {},
  variables: operation.variables,
});

if (process.env.NODE_ENV !== 'production') {
  const logger = new ApolloLink((operation, forward: NextLink) => {
    const operationName = operation.operationName;

    // tslint:disable-next-line:no-console
    console.log(
      `\n\n\n=============Apollo operation: ${operationName}==============\n`,
      processOperation(operation),
      `\n============End Apollo operation: ${operationName}================`
    );

    if (!forward) {
      return forward;
    }

    const fop = forward(operation);

    if (fop.map) {
      return fop.map(result => {
        // tslint:disable-next-line:no-console
        console.log(
          '\n\n\n',
          `=====Received result from Apollo operation: ${operationName}=====\n`,
          result,
          `\n===End Received result from Apollo operation: ${operationName}===`
        );
        return result;
      });
    }

    return fop;
  });

  link = logger.concat(link);
}

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export default class App extends React.Component<{}, {}> {
  render() {
    return (
      <Provider store={store}>
        <ApolloProvider client={client}>
          <AppWithNavigationState />
        </ApolloProvider>
      </Provider>
    );
  }
}
