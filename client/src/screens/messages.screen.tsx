import update from 'immutability-helper';
import moment from 'moment';
import randomColor from 'randomcolor';
import * as React from 'react';
import { ChildProps, compose, graphql } from 'react-apollo';
import {
  ActivityIndicator,
  FlatList,
  FlatListProperties,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationNavigatorProps, NavigationProp } from 'react-navigation';
import MessageInput from '../components/message-input.component';
import Message from '../components/message.component';
import CREATE_MESSAGE_MUTATION from '../graphql/create-message.mutation';
import { GROUP_QUERY } from '../graphql/group.query';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/message-added.subscription';
import USER_QUERY from '../graphql/user.query';
import { messageToEdge } from '../utils';
import { connect } from 'react-redux';
import { ReduxState, getUser } from '../reducers/auth.reducer';
import {
  CreateMessageMutation,
  MessageEdgeFragmentFragment,
  MessageFragmentFragment,
  GroupQuery,
  GroupFragmentFragment,
} from '../graphql/operation-result-types';
import {
  CreateMessageMutationFunc,
  CreateMessageMutationProps,
  UserQueryWithData,
  GroupQueryWithData,
} from '../graphql/operation-graphql-types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#e5ddd5',
    flex: 1,
    flexDirection: 'column',
  },
  loading: {
    justifyContent: 'center',
  },
});

interface NavigationState {
  params: { title: string; groupId: string };
}

type NavigationProps = NavigationProp<NavigationState, {}>;
type NavigatorProps = NavigationNavigatorProps<NavigationState>;

interface FromReduxState {
  id: string;
  username: string;
}

type OwnProps = NavigatorProps & {
  loadMoreEntries: () => undefined;
  subscribeToNewMessages: () => () => undefined;
};

type InputProps = OwnProps &
  GroupQueryWithData &
  CreateMessageMutationProps &
  FromReduxState;

type MessagesProps = ChildProps<InputProps, GroupQuery & CreateMessageMutation>;

interface MessagesState {
  usernameColors: { [key: string]: string };
  refreshing: boolean;
  loadingMoreEntries: boolean;
}

class Messages extends React.Component<MessagesProps> {
  static navigationOptions = (options: NavigatorProps) => {
    const navigation = options.navigation as NavigationProps;
    return { title: navigation.state.params.title };
  };

  state: MessagesState = {
    usernameColors: {},
    refreshing: false,
    loadingMoreEntries: false,
  };

  private flatList: FlatList<GroupFragmentFragment>;

  private newMessageSubscription: () => undefined;

  componentWillReceiveProps(nextProps: MessagesProps) {
    if (nextProps.group && nextProps.group.users) {
      const usernameColors = { ...this.state.usernameColors };

      nextProps.group.users.forEach(user => {
        const { username = '' } = user || {};
        if (username) {
          usernameColors[username] = usernameColors[username] || randomColor();
        }
      });

      this.setState(prevState => {
        return { ...prevState, usernameColors };
      });
    }

    if (!nextProps.group && this.newMessageSubscription) {
      this.newMessageSubscription();
    }

    const { group: nextGrp } = nextProps;
    const { group: currentGrp } = this.props;

    if (nextGrp && (!currentGrp || nextGrp.id !== currentGrp.id)) {
      if (this.newMessageSubscription) {
        this.newMessageSubscription();
      }

      this.newMessageSubscription = nextProps.subscribeToNewMessages();
    }
  }

  componentWillUnmount() {
    if (this.newMessageSubscription) {
      this.newMessageSubscription();
    }
  }

  render() {
    const { loading, group, error } = this.props;

    if (error) {
      return (
        <View>
          <Text>Error fetching groups!</Text>
        </View>
      );
    }

    if (loading && !group) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    const edges = (group && group.messages && group.messages.edges) || [];

    return (
      <KeyboardAvoidingView
        behavior={'position'}
        contentContainerStyle={styles.container}
        keyboardVerticalOffset={64}
        style={styles.container}
      >
        <FlatList
          ref={this.makeFlatList}
          data={edges}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          onEndReached={this.onEndReached}
          inverted={true}
        />

        <MessageInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }

  private keyExtractor = (item: MessageEdgeFragmentFragment) => item.node.id;

  private renderItem = ({
    item: { node: message },
  }: {
    item: MessageEdgeFragmentFragment;
    index: number;
  }) => {
    const { username = '', id = '-1' } = message.from || {};
    return (
      <Message
        color={this.state.usernameColors[username || '']}
        isCurrentUser={id === this.props.id}
        message={message}
      />
    );
  };

  private makeFlatList = (
    c: React.Component<FlatListProperties<GroupFragmentFragment>> &
      FlatList<GroupFragmentFragment>
  ) => (this.flatList = c);

  private send = async (text: string) => {
    if (!text) {
      return;
    }

    await this.props.createMessage(text);

    this.flatList.scrollToIndex({
      animated: true,
      index: 0,
    });
  };

  private onEndReached = async () => {
    const { group, loadMoreEntries } = this.props;

    const hasNextPage =
      group && group.messages && group.messages.pageInfo.hasNextPage;

    if (!this.state.loadingMoreEntries && hasNextPage) {
      this.setState(previousState => ({
        ...previousState,
        loadingMoreEntries: true,
      }));

      await loadMoreEntries();

      this.setState(previousState => ({
        ...previousState,
        loadingMoreEntries: false,
      }));
    }
  };
}

const ITEMS_PER_PAGE = 10;

export default compose(
  connect<FromReduxState, {}, {}, ReduxState>(state => ({
    ...getUser(state),
  })),

  graphql<GroupQuery, InputProps>(GROUP_QUERY, {
    props: props => {
      const {
        loading,
        group,
        fetchMore,
        error,
        subscribeToMore,
      } = props.data as GroupQueryWithData;

      if (!group || loading || error) {
        return { loading, error };
      }

      const edges = (group.messages && group.messages.edges) || [];
      const lastMessageIndex = edges.length - 1;
      const lastMessage = edges[lastMessageIndex];
      const after =
        lastMessageIndex >= 0 ? lastMessage && lastMessage.cursor : null;

      const { navigation } = props.ownProps;
      const id = navigation ? navigation.state.params.groupId : '-1';

      return {
        loading,
        error,
        group,

        loadMoreEntries: () =>
          fetchMore({
            variables: {
              id,
              messageConnection: {
                first: ITEMS_PER_PAGE,
                after,
              },
            },

            updateQuery(previousResult, options) {
              const fetchMoreResult = options.fetchMoreResult;

              if (
                !(
                  fetchMoreResult &&
                  fetchMoreResult.group &&
                  fetchMoreResult.group.messages
                )
              ) {
                return previousResult;
              }

              return update(previousResult, {
                group: {
                  messages: {
                    edges: { $push: fetchMoreResult.group.messages.edges },
                    pageInfo: { $set: fetchMoreResult.group.messages.pageInfo },
                  },
                },
              });
            },
          }),

        subscribeToNewMessages: () =>
          subscribeToMore({
            document: MESSAGE_ADDED_SUBSCRIPTION,

            variables: {
              groupIds: [id],
            },

            updateQuery(previous: GroupQuery, { subscriptionData: { data } }) {
              return updateGroupQueryWithMessage(previous, data.messageAdded)
                .updatedGroup;
            },
          }),
      };
    },

    options: ({ navigation }) => {
      return {
        variables: {
          id: (navigation && navigation.state.params.groupId) || '-1',
          messageConnection: {
            first: ITEMS_PER_PAGE,
          },
        },
      };
    },
  }),

  graphql<CreateMessageMutation, InputProps>(CREATE_MESSAGE_MUTATION, {
    props: props => {
      const mutate = props.mutate as CreateMessageMutationFunc;
      const { navigation, id, username } = props.ownProps;
      const groupId = (navigation && navigation.state.params.groupId) || '-1';

      return {
        createMessage: (text: string) =>
          mutate({
            variables: {
              message: {
                text,
                groupId,
              },
            },
            optimisticResponse: {
              __typename: 'Mutation',
              createMessage: {
                __typename: 'Message',
                id: '-1',
                text,
                createdAt: new Date().toISOString(),
                from: {
                  __typename: 'User',
                  id,
                  username,
                },
                to: {
                  __typename: 'Group',
                  id: groupId,
                },
              },
            },

            update(store, { data }) {
              if (!data) {
                return;
              }

              const groupData = store.readQuery({
                query: GROUP_QUERY,
                variables: {
                  id: groupId,
                  messageConnection: {
                    first: ITEMS_PER_PAGE,
                  },
                },
              }) as GroupQuery;

              const newMessage = data.createMessage;

              const {
                updatedGroup,
                updatedMessage,
              } = updateGroupQueryWithMessage(groupData, newMessage);

              if (!updatedGroup) {
                return;
              }

              store.writeQuery({
                query: GROUP_QUERY,
                variables: {
                  id: groupId,
                  messageConnection: {
                    first: ITEMS_PER_PAGE,
                  },
                },
                data: updatedGroup,
              });

              const userData = store.readQuery({
                query: USER_QUERY,
                variables: {
                  id,
                },
              }) as UserQueryWithData;

              if (!(userData.user && userData.user.groups)) {
                return;
              }

              let grpIndex;

              const userGrp = userData.user.groups.find((g, i) => {
                if ((g && g.id) === groupId) {
                  grpIndex = i;
                  return true;
                }
                return false;
              });

              if (!(userGrp && userGrp.messages && userGrp.messages.edges)) {
                return;
              }

              const firstMsg = userGrp.messages.edges[0];

              if (!firstMsg) {
                return;
              }

              if (
                moment(firstMsg.node.createdAt).isAfter(
                  moment(newMessage.createdAt)
                )
              ) {
                return;
              }

              const updatedUserGrp = update(userGrp, {
                messages: {
                  edges: {
                    $unshift: [updatedMessage],
                  },
                },
              });

              store.writeQuery({
                query: USER_QUERY,
                variables: {
                  id,
                },
                data: update(userData, {
                  user: {
                    groups: {
                      $splice: [[grpIndex, 1, updatedUserGrp]],
                    },
                  },
                }),
              });
            },
          }),
      };
    },
  })
)(Messages);

const updateGroupQueryWithMessage = (
  groupData: GroupQuery,
  message: MessageFragmentFragment
) => {
  const result = {
    updatedGroup: undefined,
    updatedMessage: undefined,
  };

  if (
    !(
      message.id &&
      groupData.group &&
      groupData.group.messages &&
      groupData.group.messages.edges
    )
  ) {
    return result;
  }

  if (
    groupData.group.messages.edges.some(m => (m && m.node.id) === message.id)
  ) {
    return result;
  }

  const newMessageAsEdge = messageToEdge(message);

  return {
    updatedGroup: update(groupData, {
      group: {
        messages: {
          edges: {
            $unshift: [newMessageAsEdge],
          },
        },
      },
    }),
    updatedMessage: newMessageAsEdge,
  };
};
