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
  MessageType,
} from '../graphql/types.query';

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
  loading: boolean;
  group: GroupType;
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
  createMessage: (params: CreateMessageParams) => Promise<Mutation>;
};

type InputProps = OwnProps &
  GroupQueryWithData &
  CreateMessageMutationWithVariables;

type MessagesProps = ChildProps<InputProps, GroupQuery & CreateMessageMutation>;

class Messages extends React.Component<MessagesProps> {
  static navigationOptions = (options: NavigatorProps) => {
    const navigation = options.navigation as NavigationProps;
    return { title: navigation.state.params.title };
  };

  state: {
    usernameColors: { [key: string]: string };
  } = {
    usernameColors: {},
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
    const { loading, group } = this.props;

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
          data={group.messages.slice().reverse()}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />

        <MessageInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }

  keyExtractor = (item: MessageType) => item.id;

  renderItem = ({ item: message }: { item: MessageType; index: number }) => (
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
    await this.props.createMessage({
      text,
      userId: '1',
    });

    this.flatList.scrollToEnd({ animated: true });
  };
}

export default compose(
  graphql<GroupQuery, InputProps>(GROUP_QUERY, {
    props: props => {
      const data = props.data as GroupQueryWithData;
      return data;
    },
    options: ownProps => {
      const navigation = ownProps.navigation as NavigationProps;
      return {
        variables: {
          groupId: navigation.state.params.groupId,
        },
      };
    },
  }),
  graphql<CreateMessageMutation, InputProps>(CREATE_MESSAGE_MUTATION, {
    props: props => {
      const mutate = props.mutate as Mutation;
      const ownProps = props.ownProps;
      const navigation = ownProps.navigation as NavigationProps;
      const groupId = navigation.state.params.groupId;
      return {
        ...ownProps,
        createMessage: (params: CreateMessageParams) => {
          return mutate({
            variables: { ...params, groupId },
            optimisticResponse: {
              __typename: 'Mutation',
              createMessage: {
                __typename: 'Message',
                id: '-1',
                text: params.text,
                createdAt: new Date().toISOString(),
                from: {
                  __typename: 'User',
                  id: params.userId,
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
              const storeData = store.readQuery({
                query: GROUP_QUERY,
                variables: { groupId },
              }) as GroupQueryWithData;

              const group = storeData.group;
              const existingMessages = group.messages;
              const newMessage = data.createMessage;

              if (
                newMessage.id !== null &&
                existingMessages.some(m => m.id === newMessage.id)
              ) {
                return;
              }

              const newMessages = [newMessage, ...existingMessages];
              const newGroup = { ...group, messages: newMessages };

              store.writeQuery({
                query: GROUP_QUERY,
                variables: { groupId },
                data: { ...storeData, group: newGroup },
              });
            },
          });
        },
      };
    },
  })
)(Messages);
