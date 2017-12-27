import update from 'immutability-helper';
import * as React from 'react';
import { ChildProps, compose, graphql } from 'react-apollo';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import {
  addNavigationHelpers,
  NavigationActions,
  NavigationDispatch,
  NavigationStackAction,
  NavigationState,
  StackNavigator,
  TabNavigator,
} from 'react-navigation';
import { connect } from 'react-redux';
import { wsClient } from './App';
import GROUP_ADDED_SUBSCRIPTION from './graphql/group-added.subscription';
import MESSAGE_ADDED_SUBSCRIPTION from './graphql/message-added.subscription';
import { UserQuery, UserQueryWithData } from './graphql/types.query';
import USER_QUERY from './graphql/user.query';
import FinalizeGroup from './screens/finalize-group.screen';
import Groups from './screens/groups.screen';
import Messages from './screens/messages.screen';
import NewGroup from './screens/new-group.screens';
import { messageToEdge } from './utils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    justifyContent: 'center',
  },
  selected: {
    color: 'blue',
  },
});

const TestScreen = (title: string) => () => (
  <View style={styles.container}>
    <Text>{title}</Text>
  </View>
);

const MainScreenNavigator = TabNavigator({
  Chats: {
    screen: Groups,
    navigationOptions: {
      tabBarLabel: 'Chats',
    },
  },
  Settings: {
    screen: TestScreen('Settings'),
    navigationOptions: {
      tabBarLabel: 'Settings',
    },
  },
});

const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Messages: { screen: Messages },
  NewGroup: {
    screen: NewGroup,
  },
  FinalizeGroup: {
    screen: FinalizeGroup,
  },
});

const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(
  firstAction,
  undefined
);
const initialNavState = AppNavigator.router.getStateForAction(
  tempNavState,
  undefined
);

export const navigationReducer = (
  state = initialNavState,
  action: { type: string }
) => AppNavigator.router.getStateForAction(action, state) || state;

interface State {
  nav: NavigationState;
}

interface StateProps {
  nav: NavigationState;
}

interface OwnProps {
  dispatch: NavigationDispatch<NavigationStackAction>;
  subscribeToMessages: () => () => undefined;
  subscribeToGroups: () => () => undefined;
}

type InputProps = StateProps & OwnProps & UserQueryWithData;

type AppWithNavigationStateProps = ChildProps<InputProps, UserQuery>;

class AppWithNavigationState extends React.Component<
  AppWithNavigationStateProps
> {
  private messageSubscription: () => undefined;
  private groupSubscription: () => undefined;
  // tslint:disable-next-line:ban-types
  private reconnected: Function;

  componentDidMount() {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    }
  }

  componentWillUnMount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    }

    if (this.messageSubscription) {
      this.messageSubscription();
    }

    if (this.groupSubscription) {
      this.groupSubscription();
    }
  }

  componentWillReceiveProps(nextProps: AppWithNavigationStateProps) {
    // unsubscribe if there is no user
    if (!nextProps.user) {
      if (this.messageSubscription) {
        this.messageSubscription();
      }

      if (this.groupSubscription) {
        this.groupSubscription();
      }

      if (this.reconnected) {
        this.reconnected();
      } else {
        this.reconnected = wsClient.onReconnected(() => {
          this.props.refetch();
        }, this);
      }
    }

    if (
      nextProps.user && // the next user
      (!this.props.user || // and no current user
        // if current user has received additional group(s), we want to
        // subscribe to new messages from the additional group(s)
        this.props.user.groups.length !== nextProps.user.groups.length)
    ) {
      // unsubscribe from old
      if (this.messageSubscription) {
        this.messageSubscription();
      }
      // subscribe to new
      this.messageSubscription = nextProps.subscribeToMessages();
    }

    if (nextProps.user && !this.groupSubscription) {
      this.groupSubscription = nextProps.subscribeToGroups();
    }
  }

  onBackPress = () => {
    const { dispatch, nav } = this.props;

    if (nav.index === 0) {
      return false;
    }

    dispatch(NavigationActions.back());
    return true;
  };

  render() {
    const { dispatch, nav } = this.props;

    return (
      <AppNavigator
        navigation={addNavigationHelpers({ dispatch, state: nav })}
      />
    );
  }
}

export default compose(
  connect<StateProps, OwnProps, {}, State>(({ nav }) => {
    return { nav };
  }),

  graphql<UserQuery, InputProps>(USER_QUERY, {
    props: props => {
      const {
        loading,
        error,
        subscribeToMore,
        refetch,
        user,
      } = props.data as UserQueryWithData;
      return {
        loading,
        error,
        refetch,
        user,
        subscribeToMessages() {
          return subscribeToMore({
            document: MESSAGE_ADDED_SUBSCRIPTION,

            variables: {
              userId: user.id,
              groupIds: user.groups.map(g => g.id),
            },

            updateQuery(previous: UserQuery, { subscriptionData: { data } }) {
              const newMessage = data.messageAdded;
              let grpIndex = -1;
              const group = previous.user.groups.find((g, i) => {
                if (g.id === newMessage.to.id) {
                  grpIndex = i;
                  return true;
                }
                return false;
              });

              if (!group || grpIndex === -1) {
                return previous;
              }

              return update(previous, {
                user: {
                  groups: {
                    [grpIndex]: {
                      messages: {
                        edges: {
                          $unshift: [messageToEdge(newMessage)],
                        },
                      },
                    },
                  },
                },
              });
            },
          });
        },
        subscribeToGroups() {
          return subscribeToMore({
            document: GROUP_ADDED_SUBSCRIPTION,

            variables: {
              userId: user.id,
            },

            updateQuery(previous: UserQuery, { subscriptionData: { data } }) {
              return update(previous, {
                user: {
                  groups: {
                    $push: [data.groupAdded],
                  },
                },
              });
            },
          });
        },
      };
    },
    options: () => {
      return { variables: { id: '1' } };
    },
  })
)(AppWithNavigationState);
