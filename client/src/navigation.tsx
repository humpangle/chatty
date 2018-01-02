import update from 'immutability-helper';
import * as React from 'react';
import { ChildProps, compose, graphql } from 'react-apollo';
import { BackHandler, Platform } from 'react-native';
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
import { UserQueryWithData } from './graphql/operation-graphql-types';
import { UserQuery } from './graphql/operation-result-types';
import USER_QUERY from './graphql/user.query';
import FinalizeGroup from './screens/finalize-group.screen';
import Groups from './screens/groups.screen';
import Messages from './screens/messages.screen';
import NewGroup from './screens/new-group.screens';
import { messageToEdge } from './utils';
import Signin from './screens/signup.screen';
import { Reducer } from 'redux';
import Settings from './screens/settings.screen';
import {
  ActionType,
  ActionTypeKeys,
  ReduxState,
  getUser,
} from './reducers/auth.reducer';

const MainScreenNavigator = TabNavigator({
  Chats: {
    screen: Groups,
    navigationOptions: {
      tabBarLabel: 'Chats',
    },
  },

  Settings: {
    screen: Settings,
  },
});

const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Signin: {
    screen: Signin,
  },
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

export const navigationReducer: Reducer<NavigationState> = (
  state = initialNavState,
  action: ActionType
) => {
  let nextState = AppNavigator.router.getStateForAction(action, state) || state;

  const routeToSignin = () => {
    const { routes, index } = state;

    if (routes[index].routeName !== 'Signin') {
      nextState = AppNavigator.router.getStateForAction(
        NavigationActions.reset({
          index: 0,
          actions: [NavigationActions.navigate({ routeName: 'Signin' })],
        }),
        state
      );
    }
  };

  switch (action.type) {
    case ActionTypeKeys.REHYDRATE:
      if (!(action.payload && action.payload.auth.jwt)) {
        routeToSignin();
      }
      break;

    case ActionTypeKeys.LOGOUT:
      routeToSignin();
      break;

    default:
      return nextState;
  }

  return nextState;
};

interface State {
  nav: NavigationState;
}

interface FromReduxState {
  nav: NavigationState;
  id: string;
}

interface OwnProps {
  dispatch: NavigationDispatch<NavigationStackAction>;
  subscribeToMessages: () => () => undefined;
  subscribeToGroups: () => () => undefined;
}

type InputProps = FromReduxState & OwnProps & UserQueryWithData;

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

    const currentUser = this.props.user;
    const currentGrps = currentUser && currentUser.groups;
    const nextUser = nextProps.user;
    const nextGrps = nextUser && nextUser.groups;

    if (
      nextUser && // the next user
      (!currentUser || // and no current user
        // if current user has received additional group(s), we want to
        // subscribe to new messages from the additional group(s)
        (currentGrps && currentGrps.length) !== (nextGrps && nextGrps.length))
    ) {
      // unsubscribe from old
      if (this.messageSubscription) {
        this.messageSubscription();
      }
      // subscribe to new
      this.messageSubscription = nextProps.subscribeToMessages();
    }

    if (nextUser && !this.groupSubscription) {
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
  connect<FromReduxState, {}, {}, ReduxState & State>(state => {
    return {
      nav: state.nav,
      id: getUser(state).id,
    };
  }),

  graphql<UserQuery, InputProps>(USER_QUERY, {
    skip: ({ id }) => !id,

    options: ({ id }) => {
      return {
        variables: {
          id,
        },
      };
    },

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
          const groups = (user && user.groups) || [];

          return subscribeToMore({
            document: MESSAGE_ADDED_SUBSCRIPTION,

            variables: {
              groupIds: groups.map(g => (g ? g.id : '')),
            },

            updateQuery(previous: UserQuery, { subscriptionData: { data } }) {
              const newMessage = data.messageAdded;
              const previousGrps =
                (previous.user && previous.user.groups) || [];

              let grpIndex = -1;
              const group = previousGrps.find((g, i) => {
                if ((g && g.id) === newMessage.to.id) {
                  grpIndex = i;
                  return true;
                }

                return false;
              });

              if (!group || grpIndex === -1) {
                return previous;
              }

              const { routes, index } = props.ownProps.nav;
              const currentRoute = routes[index];
              const routeName = currentRoute.routeName;
              const routeGrpId =
                currentRoute.params && currentRoute.params.groupId;
              let unreadCount = group.unreadCount || 0;

              if (routeName !== 'Messages' || routeGrpId !== group.id) {
                unreadCount += 1;
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
                      unreadCount: {
                        $set: unreadCount,
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

            // variables: {}, the user subscribing will be handled by server

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
  })
)(AppWithNavigationState);
