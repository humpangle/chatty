import moment from 'moment';
import * as React from 'react';
import { ChildProps, graphql } from 'react-apollo';
import {
  ActivityIndicator,
  Button,
  FlatList,
  FlatListProperties,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Icon from 'samba6-vector-icons/FontAwesome';
import {
  UserGroupType,
  UserQuery,
  UserQueryWithData,
} from '../graphql/types.query';
import { USER_QUERY } from '../graphql/user.query';
import reactLogo from '../images/react.png';

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
  groupTextContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 6,
  },
  groupText: {
    color: '#8c8c8c',
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  groupTitleContainer: {
    flexDirection: 'row',
  },
  groupLastUpdated: {
    flex: 0.3,
    color: '#8c8c8c',
    fontSize: 11,
    textAlign: 'right',
  },
  groupUsername: {
    paddingVertical: 4,
  },
});

const formatCreatedAt = (createdAt: string) => {
  return moment(createdAt).calendar(undefined, {
    sameDay: '[Today]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    lastDay: '[Yesterday]',
    lastWeek: 'dddd',
    sameElse: 'DD/MM/YYYY',
  });
};

const Header = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.header}>
    <Button title="New Group" onPress={onPress} />
  </View>
);

interface GroupProps {
  group: UserGroupType;
  goToMessages: (params: UserGroupType) => void;
}

class Group extends React.PureComponent<GroupProps> {
  render() {
    const { id, name, messages: { edges } } = this.props.group;

    return (
      <TouchableHighlight key={id} onPress={this.goToMessages}>
        <View style={styles.groupContainer}>
          <Image style={styles.groupImage} source={reactLogo} />
          <View style={styles.groupTextContainer}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{name}</Text>
              <Text style={styles.groupLastUpdated}>
                {edges.length ? formatCreatedAt(edges[0].node.createdAt) : ''}
              </Text>
            </View>

            <Text style={styles.groupUsername}>
              {edges.length ? edges[0].node.from.username : ''}
            </Text>
            <Text style={styles.groupText} numberOfLines={1}>
              {edges.length ? edges[0].node.text : ''}
            </Text>
          </View>
          <Icon name="angle-right" size={24} color="#8c8c8c" />
        </View>
      </TouchableHighlight>
    );
  }

  private goToMessages = () => this.props.goToMessages(this.props.group);
}

interface OwnProps {
  navigation: {
    navigate: (to: string, params?: { groupId: string; title: string }) => void;
  };
}

type InputProps = OwnProps & UserQueryWithData;

type GroupsProps = ChildProps<InputProps, UserQuery>;

// tslint:disable-next-line:max-classes-per-file
class Groups extends React.Component<GroupsProps> {
  static navigationOptions = {
    title: 'Chats',
  };

  private flatList: FlatList<UserGroupType>;

  render() {
    if (this.props.loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    const { user, networkStatus } = this.props;

    if (!user.groups.length) {
      return (
        <View style={styles.container}>
          <Header onPress={this.goToNewGroup} />
          <Text style={styles.warning}>You do not have any group.</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Header onPress={this.goToNewGroup} />
        <FlatList
          ref={this.makeFlatList}
          data={user.groups}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          onRefresh={this.onRefresh}
          refreshing={networkStatus === 4}
        />
      </View>
    );
  }

  private goToMessages = (group: UserGroupType) => {
    this.props.navigation.navigate('Messages', {
      groupId: group.id,
      title: group.name,
    });
  };

  private goToNewGroup = () => this.props.navigation.navigate('NewGroup');

  private keyExtractor = (item: UserGroupType) => item.id;

  private renderItem = ({ item }: { item: UserGroupType }) => (
    <Group group={item} goToMessages={this.goToMessages} />
  );

  private makeFlatList = (
    c: React.Component<FlatListProperties<UserGroupType>> &
      FlatList<UserGroupType>
  ) => (this.flatList = c);

  private onRefresh = () => this.props.refetch();
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
