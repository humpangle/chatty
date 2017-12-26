import * as React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'samba6-vector-icons/FontAwesome';
import { UserFriendType } from '../graphql/types.query';

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  itemContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    // flexWrap: 'wrap',
    // maxWidth: 50,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: '#dbdbdb',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    width: 20,
    justifyContent: 'center',
  },
  itemImage: {
    borderRadius: 27,
    height: 54,
    width: 54,
  },
});

interface SelectedUserListItemProps {
  remove: (params: UserFriendType) => void;
  user: UserFriendType;
}

export class SelectedUserListItem extends React.PureComponent<
  SelectedUserListItemProps
> {
  remove = () => this.props.remove(this.props.user);

  render() {
    const { username } = this.props.user;

    return (
      <View style={styles.itemContainer}>
        <View style={{ paddingRight: 5 }}>
          <TouchableOpacity onPress={this.remove} style={styles.itemIcon}>
            <Icon color="#fff" name="times" size={12} />
          </TouchableOpacity>
        </View>
        <Text>{username}</Text>
      </View>
    );
  }
}

interface SelectedUserListProps {
  remove: (params: UserFriendType) => void;
  data: UserFriendType[];
}

// tslint:disable-next-line:max-classes-per-file
class SelectedUserList extends React.Component<SelectedUserListProps> {
  keyExtractor = (item: UserFriendType) => item.id;

  renderItem = ({ item: user }: { item: UserFriendType }) => (
    <SelectedUserListItem user={user} remove={this.props.remove} />
  );

  render() {
    return (
      <FlatList
        data={this.props.data}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        horizontal={true}
        style={styles.list}
      />
    );
  }
}

export default SelectedUserList;
