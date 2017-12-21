import * as React from 'react';
import { ChildProps, graphql, QueryProps } from 'react-apollo';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { UserQuery, UserType } from '../graphql/types.query';
import { USER_QUERY } from '../graphql/user.query';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
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

type UserQueryWithData = QueryProps & UserQuery;

interface OwnProps {
  navigation: {
    navigate: (to: string, params: { groupId: string; title: string }) => void;
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
      <View style={styles.container}>
        <FlatList
          data={user.groups}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    );
  }

  goToMessages = (group: AGroup) => {
    this.props.navigation.navigate('Messages', {
      groupId: group.id,
      title: group.name,
    });
  };

  keyExtractor = (item: AGroup) => item.id;

  renderItem = ({ item }: { item: AGroup }) => (
    <Group group={item} goToMessages={this.goToMessages} />
  );
}

export default graphql<UserQuery, InputProps>(USER_QUERY, {
  props: props => {
    const data = props.data as UserQueryWithData;
    return data;
  },
  options: () => {
    return { variables: { id: 1 } };
  },
})(Groups);
