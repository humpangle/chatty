import * as React from 'react';
import { ChildProps, graphql, QueryProps } from 'react-apollo';
import {
  ActivityIndicator,
  Button,
  FlatList,
  FlatListProperties,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  UserQuery,
  UserQueryVariables,
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
  warning: {
    textAlign: 'center',
    padding: 12,
  },
  header: {
    alignItems: 'flex-end',
    padding: 6,
    borderColor: '#eee',
    borderBottomWidth: 1,
  },
});

const Header = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.header}>
    <Button title="New Group" onPress={onPress} />
  </View>
);

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

type UserQueryWithData = QueryProps<UserQueryVariables> & UserQuery;

interface OwnProps {
  navigation: {
    navigate: (to: string, params?: { groupId: string; title: string }) => void;
  };
  user: UserType;
  loading: boolean;
}

type InputProps = OwnProps & UserQueryWithData;

type GroupsProps = ChildProps<InputProps, UserQuery>;

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

    if (!user.groups.length) {
      return (
        <View style={styles.container}>
          <Header onPress={this.goToNewGroup} />
          <Text style={styles.warning}>You do not have any group.</Text>
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
      </KeyboardAvoidingView>
    );
  }

  private goToMessages = (group: AGroup) => {
    this.props.navigation.navigate('Messages', {
      groupId: group.id,
      title: group.name,
    });
  };

  private goToNewGroup = () => this.props.navigation.navigate('NewGroup');

  private keyExtractor = (item: AGroup) => item.id;

  private renderItem = ({ item }: { item: AGroup }) => (
    <Group group={item} goToMessages={this.goToMessages} />
  );

  private makeFlatList = (
    c: React.Component<FlatListProperties<AGroup>> & FlatList<AGroup>
  ) => (this.flatList = c);
}

export default graphql<UserQuery, InputProps>(USER_QUERY, {
  props: props => {
    const data = props.data as UserQueryWithData;
    return data;
  },
  options: () => {
    return { variables: { id: '21' } };
  },
})(Groups);
