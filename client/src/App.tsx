import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink, NextLink } from 'apollo-client-preset';
import { HttpLink } from 'apollo-link-http';
import Expo from 'expo';
import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import AppWithNavigationState, { navigationReducer } from './navigation';

const store = createStore(
  combineReducers({ nav: navigationReducer }),
  {},
  composeWithDevTools()
);

const API_URL = Expo.Constants.manifest.extra.REACT_NATIVE_APP_API_URL;

let link = new HttpLink({ uri: `${API_URL}/graphql` }) as ApolloLink;

if (process.env.NODE_ENV !== 'production') {
  const logger = new ApolloLink((operation, forward: NextLink) => {
    // tslint:disable-next-line:no-console
    console.log('\nApollo graphql operation: ', operation.operationName);
    return forward(operation).map(result => {
      // tslint:disable-next-line:no-console
      console.log('\nreceived result from: ', operation.operationName);
      return result;
    });
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
