import moment from 'moment';
import * as React from 'react';
import { ChildProps, graphql, compose } from 'react-apollo';
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
import { UserQueryWithData } from '../graphql/operation-graphql-types';
import { USER_QUERY } from '../graphql/user.query';
import reactLogo from '../images/react.png';
import { connect } from 'react-redux';
import { ReduxState, getUser } from '../reducers/auth.reducer';
import {
  UserGroupFragmentFragment,
  UserQuery,
} from '../graphql/operation-result-types';

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
  group: UserGroupFragmentFragment;
  goToMessages: (params: UserGroupFragmentFragment) => void;
}

class Group extends React.PureComponent<GroupProps> {
  render() {
    const { id, name, messages } = this.props.group;
    const edges = (messages && messages.edges) || [];
    const firstEdge = edges[0];

    return (
      <TouchableHighlight key={id} onPress={this.goToMessages}>
        <View style={styles.groupContainer}>
          <Image style={styles.groupImage} source={reactLogo} />
          <View style={styles.groupTextContainer}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{name}</Text>
              <Text style={styles.groupLastUpdated}>
                {firstEdge ? formatCreatedAt(firstEdge.node.createdAt) : ''}
              </Text>
            </View>

            <Text style={styles.groupUsername}>
              {firstEdge ? firstEdge.node.from.username : ''}
            </Text>
            <Text style={styles.groupText} numberOfLines={1}>
              {firstEdge ? firstEdge.node.text : ''}
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

interface FromReduxState {
  id: string;
}

type InputProps = OwnProps & FromReduxState & UserQueryWithData;

type GroupsProps = ChildProps<InputProps, UserQuery>;

// tslint:disable-next-line:max-classes-per-file
class Groups extends React.Component<GroupsProps> {
  static navigationOptions = {
    title: 'Chats',
  };

  private flatList: FlatList<UserGroupFragmentFragment>;

  render() {
    const { user, networkStatus, loading } = this.props;

    if (loading || !user) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!(user.groups || []).length) {
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

  private goToMessages = (group: UserGroupFragmentFragment) => {
    const { id = '', name = '' } = group || {};

    if (id && name) {
      this.props.navigation.navigate('Messages', {
        groupId: id,
        title: name,
      });
    }
  };

  private goToNewGroup = () => this.props.navigation.navigate('NewGroup');

  private keyExtractor = (item: UserGroupFragmentFragment) => item.id;

  private renderItem = ({ item }: { item: UserGroupFragmentFragment }) => (
    <Group group={item} goToMessages={this.goToMessages} />
  );

  private makeFlatList = (
    c: React.Component<FlatListProperties<UserGroupFragmentFragment>> &
      FlatList<UserGroupFragmentFragment>
  ) => (this.flatList = c);

  private onRefresh = () => this.props.refetch();
}

export default compose(
  connect<FromReduxState, {}, {}, ReduxState>(state => {
    return {
      id: getUser(state).id,
    };
  }),

  graphql<UserQuery, InputProps>(USER_QUERY, {
    skip: ({ id }) => !id,

    props: props => {
      const data = props.data as UserQueryWithData;
      return data;
    },

    options: ({ id }) => {
      return { variables: { id } };
    },
  })
)(Groups);
