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
import { connect } from 'react-redux';
import gql from 'graphql-tag';

import { NavigationNavigatorProps, NavigationProp } from 'react-navigation';
import MessageInput from '../components/message-input.component';
import Message from '../components/message.component';
import CREATE_MESSAGE_MUTATION from '../graphql/create-message.mutation';
import { GROUP_QUERY } from '../graphql/group.query';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/message-added.subscription';
import USER_QUERY from '../graphql/user.query';
import { messageToEdge } from '../utils';
import { ReduxState, getUser } from '../reducers/auth.reducer';
import {
  CreateMessageMutation,
  MessageEdgeFragmentFragment,
  MessageFragmentFragment,
  GroupQuery,
  GroupFragmentFragment,
  UpdateGroupMutation,
  GroupUserFragmentFragment,
} from '../graphql/operation-result-types';
import {
  CreateMessageMutationFunc,
  CreateMessageMutationProps,
  UserQueryWithData,
  GroupQueryWithData,
  UpdateGroupMutationProps,
} from '../graphql/operation-graphql-types';
import UPDATE_GROUP_MUTATION from '../graphql/update-group.mutation';

const optimisticResponseGroupId = '-1';

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
  latestMessageId?: string;
  lastReadId?: string;
};

type InputProps = OwnProps &
  GroupQueryWithData &
  CreateMessageMutationProps &
  FromReduxState &
  UpdateGroupMutationProps;

type MessagesProps = ChildProps<
  InputProps,
  GroupQuery & CreateMessageMutation & UpdateGroupMutation
>;

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
    const {
      group: nextGrp,
      latestMessageId,
      lastReadId,
      updateGroup,
    } = nextProps;

    if (nextGrp) {
      if (
        // the latest message is not from the optimistic response
        latestMessageId &&
        latestMessageId !== optimisticResponseGroupId &&
        // user has not read any message or latest message
        (!lastReadId || lastReadId !== latestMessageId) &&
        updateGroup
      ) {
        updateGroup(nextGrp.name || '', latestMessageId);
      }

      const users = nextGrp.users as GroupUserFragmentFragment[];
      this.updateUserColors(users);
    }

    if (!nextGrp && this.newMessageSubscription) {
      this.newMessageSubscription();
    }

    const { group: currentGrp } = this.props;

    if (nextGrp && (!currentGrp || nextGrp.id !== currentGrp.id)) {
      if (this.newMessageSubscription) {
        this.newMessageSubscription();
      }

      this.newMessageSubscription = nextProps.subscribeToNewMessages();
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

  updateUserColors = (users: GroupUserFragmentFragment[] | null) => {
    if (!users) {
      return;
    }

    const usernameColors = { ...this.state.usernameColors };

    users.forEach(user => {
      const { username = '' } = user || {};
      if (username) {
        usernameColors[username] = usernameColors[username] || randomColor();
      }
    });

    this.setState(prevState => {
      return { ...prevState, usernameColors };
    });
  };

  keyExtractor = (item: MessageEdgeFragmentFragment) => item.node.id;

  renderItem = ({
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

  makeFlatList = (
    c: React.Component<FlatListProperties<GroupFragmentFragment>> &
      FlatList<GroupFragmentFragment>
  ) => (this.flatList = c);

  send = async (text: string) => {
    if (!text) {
      return;
    }

    await this.props.createMessage(text);

    this.flatList.scrollToIndex({
      animated: true,
      index: 0,
    });
  };

  onEndReached = async () => {
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

const fromRedux = connect<FromReduxState, {}, {}, ReduxState>(state => ({
  ...getUser(state),
}));

const fromGroupQuery = graphql<GroupQuery, InputProps>(GROUP_QUERY, {
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
    const oldestMessage = edges[edges.length - 1];
    const after = oldestMessage ? oldestMessage.cursor : null;

    const latestMessage = edges[0];
    const latestMessageId = latestMessage ? latestMessage.node.id : undefined;

    const lastRead = group.lastRead;
    const lastReadId = lastRead ? lastRead.id : undefined;

    const { navigation } = props.ownProps;
    const id = navigation ? navigation.state.params.groupId : '-1';

    return {
      loading,
      error,
      group,
      latestMessageId,
      lastReadId,

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
            const { fetchMoreResult } = options;

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
});

const fromCreateMessageMutation = graphql<CreateMessageMutation, InputProps>(
  CREATE_MESSAGE_MUTATION,
  {
    props: props => {
      const mutate = props.mutate as CreateMessageMutationFunc;
      const { navigation, id: userId, username } = props.ownProps;
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
                id: optimisticResponseGroupId,
                text,
                createdAt: new Date().toISOString(),
                from: {
                  __typename: 'User',
                  id: userId,
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

              // prepend newly created message in group's messages
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

              // update user query with updated group above
              const userData = store.readQuery({
                query: USER_QUERY,
                variables: {
                  id: userId,
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

              const currentLatestMsg = userGrp.messages.edges[0];

              if (!currentLatestMsg) {
                return;
              }

              /* We are only displaying the latest message in the screen where
            USER_QUERY is used. So if the newly created message is, by chance,
            older than the current latest message we are displaying, we do
            no update.
            */
              if (
                moment(currentLatestMsg.node.createdAt).isAfter(
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
                  id: userId,
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
  }
);

const fromUpdateGroupMutation = graphql<UpdateGroupMutation, InputProps>(
  UPDATE_GROUP_MUTATION,
  {
    props: props => {
      const mutate = props.mutate;

      if (!mutate) {
        return {};
      }

      const { navigation } = props.ownProps;
      const groupId = (navigation && navigation.state.params.groupId) || '-1';
      return {
        updateGroup: (name: string, lastRead: string) =>
          mutate({
            variables: {
              group: {
                name,
                lastRead,
                id: groupId,
              },
            },

            update: (store, { data }) => {
              if (!data) {
                return;
              }

              const updateGroup = data.updateGroup;

              if (!updateGroup) {
                return;
              }

              store.writeFragment({
                id: `Group:${updateGroup.id}`,
                fragment: gql`
                  fragment group on Group {
                    unreadCount
                  }
                `,
                data: {
                  __typename: 'Group',
                  unreadCount: 0,
                },
              });
            },
          }),
      };
    },
  }
);

export default compose(
  fromRedux,
  fromGroupQuery,
  fromCreateMessageMutation,
  fromUpdateGroupMutation
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
