import * as React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'samba6-vector-icons/FontAwesome';
import { UserType } from '../graphql/types.query';

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  itemContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: '#dbdbdb',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: 'row',
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -3,
    width: 20,
  },
  itemImage: {
    borderRadius: 27,
    height: 54,
    width: 54,
  },
});

interface SelectedUserListItemProps {
  remove: (params: UserType) => void;
  user: UserType;
}

export class SelectedUserListItem extends React.PureComponent<
  SelectedUserListItemProps
> {
  remove = () => this.props.remove(this.props.user);

  render() {
    const { username } = this.props.user;

    return (
      <View>
        <View style={styles.itemContainer}>
          <Image
            style={styles.itemImage}
            source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
          />
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
  remove: (params: UserType) => void;
  data: UserType[];
}

// tslint:disable-next-line:max-classes-per-file
class SelectedUserList extends React.Component<SelectedUserListProps> {
  keyExtractor = (item: UserType) => item.id;

  renderItem = ({ item: user }: { item: UserType }) => (
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
