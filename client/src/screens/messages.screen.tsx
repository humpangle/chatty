import { ApolloQueryResult } from 'apollo-client-preset';
import { Buffer } from 'buffer/';
import update from 'immutability-helper';
import moment from 'moment';
import randomColor from 'randomcolor';
import * as React from 'react';
import {
  ChildProps,
  compose,
  graphql,
  MutationFunc,
  QueryProps,
} from 'react-apollo';
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
import {
  CreateMessageMutation,
  CreateMessageMutationVariables,
  GroupQuery,
  GroupType,
  MessageEdge,
  UserQueryWithData,
} from '../graphql/types.query';
import USER_QUERY from '../graphql/user.query';

// mock user id - will be removed when auth is implemented
const mockUserId = '1';

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

type OwnProps = NavigatorProps & {
  loadMoreEntries: () => undefined;
};

type GroupQueryWithData = GroupQuery & QueryProps;

type Mutation = MutationFunc<
  CreateMessageMutation,
  CreateMessageMutationVariables
>;

interface CreateMessageParams {
  text: string;
  userId: string;
}

type CreateMessageMutationWithVariables = Mutation & {
  createMessage: (
    params: CreateMessageParams
  ) => Promise<ApolloQueryResult<CreateMessageMutation>>;
};

type InputProps = OwnProps &
  GroupQueryWithData &
  CreateMessageMutationWithVariables;

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

  private flatList: FlatList<GroupType>;

  componentWillReceiveProps(nextProps: MessagesProps) {
    if (nextProps.group && nextProps.group.users) {
      const usernameColors = { ...this.state.usernameColors };

      nextProps.group.users.forEach(({ username }) => {
        usernameColors[username] = usernameColors[username] || randomColor();
      });

      this.setState(prevState => {
        return { ...prevState, usernameColors };
      });
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

    return (
      <KeyboardAvoidingView
        behavior={'position'}
        contentContainerStyle={styles.container}
        keyboardVerticalOffset={64}
        style={styles.container}
      >
        <FlatList
          ref={this.makeFlatList}
          data={group.messages.edges}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          onEndReached={this.onEndReached}
          inverted={true}
        />

        <MessageInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }

  private keyExtractor = (item: MessageEdge) => item.node.id;

  private renderItem = ({
    item: { node: message },
  }: {
    item: MessageEdge;
    index: number;
  }) => (
    <Message
      color={this.state.usernameColors[message.from.username]}
      isCurrentUser={message.from.id === '1'}
      message={message}
    />
  );

  private makeFlatList = (
    c: React.Component<FlatListProperties<GroupType>> & FlatList<GroupType>
  ) => (this.flatList = c);

  private send = async (text: string) => {
    if (!text) {
      return;
    }

    await this.props.createMessage({
      text,
      userId: mockUserId,
    });

    this.flatList.scrollToIndex({
      animated: true,
      index: 0,
    });
  };

  private onEndReached = async () => {
    const { group, loadMoreEntries } = this.props;

    if (!this.state.loadingMoreEntries && group.messages.pageInfo.hasNextPage) {
      this.setState(previousState => ({
        ...previousState,
        loadingMoreEntries: true,
      }));
    }

    await loadMoreEntries();

    this.setState(previousState => ({
      ...previousState,
      loadingMoreEntries: false,
    }));
  };
}

const ITEMS_PER_PAGE = 10;

export default compose(
  graphql<GroupQuery, InputProps>(GROUP_QUERY, {
    props: props => {
      const data = props.data as GroupQueryWithData;
      const { loading, group, fetchMore, error } = data;

      if (loading || error) {
        return { loading, error };
      }

      const lastMessageIndex = group.messages.edges.length - 1;
      const after =
        lastMessageIndex >= 0
          ? group.messages.edges[lastMessageIndex].cursor
          : null;

      return {
        loading,
        error,
        group,
        loadMoreEntries: () =>
          fetchMore({
            variables: {
              first: ITEMS_PER_PAGE,
              after,
            },
            updateQuery: (previousResult, options) => {
              const fetchMoreResult = options.fetchMoreResult as GroupQueryWithData;

              if (!fetchMoreResult) {
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
      };
    },
    options: ownProps => {
      return {
        variables: {
          groupId:
            (ownProps.navigation && ownProps.navigation.state.params.groupId) ||
            '-1',
          first: ITEMS_PER_PAGE,
        },
      };
    },
  }),

  graphql<CreateMessageMutation, InputProps>(CREATE_MESSAGE_MUTATION, {
    props: props => {
      const mutate = props.mutate as Mutation;
      const ownProps = props.ownProps;
      const groupId =
        (ownProps.navigation && ownProps.navigation.state.params.groupId) ||
        '-1';
      return {
        createMessage: ({ userId, text }: CreateMessageParams) => {
          return mutate({
            variables: { userId, text, groupId },
            optimisticResponse: {
              __typename: 'Mutation',
              createMessage: {
                __typename: 'Message',
                id: '-1',
                text,
                createdAt: new Date().toISOString(),
                from: {
                  __typename: 'User',
                  id: userId,
                  username: 'Justyn.Kautzer',
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
                  groupId,
                  first: ITEMS_PER_PAGE,
                },
              }) as GroupQueryWithData;

              const newMessage = data.createMessage;

              if (
                newMessage.id &&
                groupData.group.messages.edges.some(
                  m => m.node.id === newMessage.id
                )
              ) {
                return;
              }

              const newMessageAsEdge = {
                __typename: 'MessageEdge',
                node: newMessage,
                cursor: Buffer.from(newMessage.id.toString()).toString(
                  'base64'
                ),
              };

              store.writeQuery({
                query: GROUP_QUERY,
                variables: {
                  groupId,
                  first: ITEMS_PER_PAGE,
                },
                data: update(groupData, {
                  group: {
                    messages: {
                      edges: {
                        $unshift: [newMessageAsEdge],
                      },
                    },
                  },
                }),
              });

              const userData = store.readQuery({
                query: USER_QUERY,
                variables: {
                  id: '21',
                },
              }) as UserQueryWithData;

              let grpIndex;

              const userGrp = userData.user.groups.find((g, i) => {
                if (g.id === groupId) {
                  grpIndex = i;
                  return true;
                }
                return false;
              });

              if (
                !userGrp ||
                (userGrp.messages.edges.length &&
                  moment(userGrp.messages.edges[0].node.createdAt).isAfter(
                    moment(newMessage.createdAt)
                  ))
              ) {
                return;
              }

              const updatedUserGrp = update(userGrp, {
                messages: {
                  edges: {
                    $unshift: [newMessageAsEdge],
                  },
                },
              });

              store.writeQuery({
                query: USER_QUERY,
                variables: {
                  id: '21',
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
          });
        },
      };
    },
  })
)(Messages);
