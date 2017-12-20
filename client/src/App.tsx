import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink, NextLink } from 'apollo-client-preset';
import { HttpLink } from 'apollo-link-http';
import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { StyleSheet, Text, View } from 'react-native';

let link = new HttpLink({
  uri: 'https://api.graph.cool/simple/v1/cjazk9eed1cfp0197ngkx7cc6',
}) as ApolloLink | HttpLink;

if (process.env.NODE_ENV !== 'production') {
  const logger = new ApolloLink((operation, forward: NextLink) => {
    // tslint:disable-next-line:no-console
    console.log(operation.operationName);
    return forward(operation).map(result => {
      // tslint:disable-next-line:no-console
      console.log(`received result from ${operation.operationName}`);
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
      <ApolloProvider client={client}>
        <View style={styles.container}>
          <Text>Open up App.js to start working on your app!</Text>
          <Text>Changes you make will automatically reload.</Text>
          <Text>Shake your phone to open the developer menu.</Text>
        </View>
      </ApolloProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
