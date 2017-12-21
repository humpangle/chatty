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
  TouchableHighlight,
  View,
} from 'react-native';
import CreateGroupInput from '../components/create-group-input.component';
import CREATE_GROUP_MUTATION from '../graphql/create-group.mutation';
import {
  CreateGroupMutation,
  CreateGroupMutationVariables,
  UserQuery,
  UserType,
} from '../graphql/types.query';
import { USER_QUERY } from '../graphql/user.query';

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
  groupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
});

interface AGroup {
  name: string;
  id: string;
}

interface GroupProps {
  group: AGroup;
  goToMessages: (params: AGroup) => void;
}

class Group extends React.PureComponent<GroupProps> {
  render() {
    const { id, name } = this.props.group;
    const goToMessages = () => this.props.goToMessages(this.props.group);

    return (
      <TouchableHighlight key={id} onPress={goToMessages}>
        <View style={styles.groupContainer}>
          <Text style={styles.groupName}>{name}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

type Mutation = MutationFunc<CreateGroupMutation, CreateGroupMutationVariables>;

type CreateGroupMutationWithVariables = Mutation & {
  createGroup: (params: CreateGroupMutationVariables) => Promise<Mutation>;
};

type UserQueryWithData = QueryProps & UserQuery;

interface OwnProps {
  navigation: {
    navigate: (to: string, params: { groupId: string; title: string }) => void;
  };
  user: UserType;
  loading: boolean;
}

type InputProps = OwnProps &
  UserQueryWithData &
  CreateGroupMutationWithVariables;

type GroupsProps = ChildProps<InputProps, UserQuery & CreateGroupMutation>;

// tslint:disable-next-line:max-classes-per-file
class Groups extends React.Component<GroupsProps> {
  static navigationOptions = {
    title: 'Chats',
  };

  private flatList: FlatList<AGroup>;

  render() {
    const { loading, user } = this.props;

    if (loading) {
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
        keyboardVerticalOffset={100}
        style={styles.container}
      >
        <FlatList
          ref={this.makeFlatList}
          data={user.groups}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
        <CreateGroupInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }

  private goToMessages = (group: AGroup) => {
    this.props.navigation.navigate('Messages', {
      groupId: group.id,
      title: group.name,
    });
  };

  private keyExtractor = (item: AGroup) => item.id;

  private renderItem = ({ item }: { item: AGroup }) => (
    <Group group={item} goToMessages={this.goToMessages} />
  );

  private makeFlatList = (
    c: React.Component<FlatListProperties<AGroup>> & FlatList<AGroup>
  ) => (this.flatList = c);

  private send = async (name: string) => {
    await this.props.createGroup({ name, userId: this.props.user.id });
    this.flatList.scrollToEnd({ animated: true });
  };
}

export default compose(
  graphql<UserQuery, InputProps>(USER_QUERY, {
    props: props => {
      const data = props.data as UserQueryWithData;
      return data;
    },
    options: () => {
      return { variables: { id: '1' } };
    },
  }),
  graphql<CreateGroupMutation, InputProps>(CREATE_GROUP_MUTATION, {
    props: props => {
      const mutate = props.mutate as Mutation;

      return {
        createGroup({ name, userId }: CreateGroupMutationVariables) {
          return mutate({
            variables: { userId, name },
            optimisticResponse: {
              __typename: 'Mutation',
              createGroup: {
                __typename: 'Group',
                name,
                id: '-1',
              },
            },
            update(store, { data: newData }) {
              if (!newData) {
                return;
              }

              const data = store.readQuery({
                query: USER_QUERY,
                variables: { id: userId },
              }) as UserQueryWithData;

              const newGroup = newData.createGroup;
              const user = data.user;
              const existingGroups = user.groups;

              if (
                newGroup.id !== null &&
                existingGroups.some(g => g.id === newGroup.id)
              ) {
                return;
              }

              const newGroups = [newGroup, ...existingGroups];
              const newUser = { ...user, groups: newGroups };

              store.writeQuery({
                query: USER_QUERY,
                variables: { id: userId },
                data: { ...data, user: newUser },
              });
            },
          });
        },
      };
    },
  })
)(Groups);
