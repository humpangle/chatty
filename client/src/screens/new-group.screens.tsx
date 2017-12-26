import update from 'immutability-helper';
import _groupBy from 'lodash-es/groupBy';
import _keys from 'lodash-es/keys';
import * as React from 'react';
import { ChildProps, graphql, QueryProps } from 'react-apollo';
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AlphabetListView from 'react-native-alphabetlistview';
import {
  NavigationNavigatorProps,
  NavigationScreenProp,
} from 'react-navigation';
import Icon from 'samba6-vector-icons/FontAwesome';
import SelectedUserList from '../components/selected-user-list.component';
import {
  UserFriendType,
  UserQuery,
  UserQueryVariables,
  UserType,
} from '../graphql/types.query';
import USER_QUERY from '../graphql/user.query';

const sortObj = (o: { [key: string]: object }) =>
  Object.keys(o)
    .sort()
    .reduce((acc, k) => ((acc[k] = o[k]), acc), {});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cellContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cellImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  cellLabel: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selected: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: 'blue',
    fontSize: 18,
    paddingTop: 2,
  },
  checkButtonContainer: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  checkButton: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    padding: 4,
    height: 24,
    width: 24,
  },
  checkButtonIcon: {
    marginRight: -4,
  },
  text: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  view: {
    backgroundColor: '#ccc',
  },
});

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.view}>
    <Text style={styles.text}>{title}</Text>
  </View>
);

const SectionItem = ({ title }: { title: string }) => (
  <Text style={{ color: 'blue' }}>{title}</Text>
);

interface CellProps {
  item: UserType;
  isSelected: (param: UserType) => boolean;
  toggle: (param: UserType) => void;
}

class Cell extends React.PureComponent<CellProps> {
  state: { isSelected: boolean } = {
    isSelected: this.props.isSelected(this.props.item),
  };

  componentWillReceiveProps(nextProps: CellProps) {
    this.setState({
      isSelected: nextProps.isSelected(nextProps.item),
    });
  }

  toggle = () => this.props.toggle(this.props.item);

  render() {
    return (
      <View style={styles.cellContainer}>
        <Image
          style={styles.cellImage}
          source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
        />
        <Text style={styles.cellLabel}>{this.props.item.username}</Text>
        <View style={styles.checkButtonContainer}>
          <Icon.Button
            backgroundColor={this.state.isSelected ? 'blue' : 'white'}
            borderRadius={12}
            color="#fff"
            iconStyle={styles.checkButtonIcon}
            name="check"
            onPress={this.toggle}
            size={16}
            style={styles.checkButton}
          />
        </View>
      </View>
    );
  }
}

interface NavigationState {
  params: {
    mode: string;
    finalizeGroup: () => undefined;
    selected: UserFriendType[];
  };
}

type NavigatorProps = NavigationNavigatorProps<NavigationState>;

interface OwnProps {
  navigation: NavigationScreenProp<NavigationState, {}>;
  user?: UserType;
  selected?: UserFriendType[];
  loading?: boolean;
  error?: {};
}

type UserQueryWithData = QueryProps<UserQueryVariables> & UserQuery;

type InputProps = UserQueryWithData & OwnProps;

type NewGroupProps = ChildProps<InputProps, UserQuery>;

interface NewGroupState {
  selected: UserFriendType[];
  friends: { [key: string]: UserFriendType[] };
}

// tslint:disable-next-line:max-classes-per-file
class NewGroup extends React.Component<NewGroupProps> {
  static navigationOptions = ({ navigation }: NavigatorProps) => {
    let isReady = false;
    let onPress = () => void 0;

    if (navigation) {
      const { state } = navigation;
      isReady = state.params && state.params.mode === 'ready';
      onPress =
        state.params && state.params.finalizeGroup
          ? state.params.finalizeGroup
          : onPress;
    }

    return {
      title: 'New Group',
      headerRight: isReady && <Button title="Next" onPress={onPress} />,
    };
  };

  state: NewGroupState;

  constructor(props: NewGroupProps) {
    super(props);

    this.state = {
      selected:
        props.navigation && props.navigation.state.params
          ? props.navigation.state.params.selected
          : [],
      friends:
        props.user && props.user.friends
          ? sortObj(
              _groupBy<UserFriendType>(props.user.friends, friend =>
                friend.username.charAt(0).toLocaleUpperCase()
              )
            )
          : {},
    };
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected);
  }

  shouldComponentUpdate(nextProps: NewGroupProps, nextState: NewGroupState) {
    const userUnchanged = this.props.user === nextProps.user;
    const selectedUnchanged = this.state.selected === nextState.selected;
    const friendsUnchanged = this.state.friends === nextState.friends;

    if (userUnchanged && selectedUnchanged && friendsUnchanged) {
      return false;
    }

    return true;
  }

  // componentWillReceiveProps(nextProps: OwnProps) {
  //   let friends = {};

  //   if (nextProps.user && nextProps.user !== this.props.user) {
  //     friends = sortObj(
  //       _groupBy(nextProps.user.friends, friend =>
  //         friend.username.charAt(0).toLocaleUpperCase()
  //       )
  //     );
  //   }

  //   this.setState({
  //     friends,
  //     selected: nextProps.selected || [],
  //   });
  // }

  componentWillUpdate(_: OwnProps, nextState: NewGroupState) {
    if (nextState.selected.length !== this.state.selected.length) {
      this.refreshNavigation(nextState.selected);
    }
  }

  render() {
    if (this.props.loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    const data = this.state.friends;

    return (
      <View style={styles.container}>
        {this.state.selected.length ? (
          <View style={styles.selected}>
            <SelectedUserList data={this.state.selected} remove={this.toggle} />
          </View>
        ) : (
          <View />
        )}

        {_keys(data).length ? (
          <AlphabetListView
            style={{ flex: 1 }}
            data={data}
            cell={Cell}
            cellHeight={30}
            cellProps={{ isSelected: this.isSelected, toggle: this.toggle }}
            sectionListItem={SectionItem}
            sectionHeader={SectionHeader}
            sectionHeaderHeight={22.5}
          />
        ) : (
          <View />
        )}
      </View>
    );
  }

  refreshNavigation = (selected: Array<{}>) => {
    this.props.navigation.setParams({
      mode: selected.length ? 'ready' : undefined,
      finalizeGroup: this.finalizeGroup,
    });
  };

  finalizeGroup = () => {
    return this.props.navigation.navigate('FinalizeGroup', {
      selected: this.state.selected,
      friendCount: (this.props.user && this.props.user.friends.length) || 0,
      userId: (this.props.user && this.props.user.id) || '-1',
    });
  };

  isSelected = (user: UserType) => -this.getUserIndex(user) - 1;

  toggle = (user: UserType) => {
    const index = this.getUserIndex(user);
    const selected = this.state.selected;

    this.setState(prevState => ({
      ...prevState,
      selected:
        index !== -1
          ? update(selected, { $splice: [[index, 1]] })
          : [...selected, user],
    }));
  };

  private getUserIndex = (user: UserType) => this.state.selected.indexOf(user);
}

export default graphql<UserQuery, InputProps>(USER_QUERY, {
  props: props => {
    const data = props.data as UserQueryWithData;
    const { user, loading, error } = data;

    return {
      user,
      loading,
      error,
      ...props.ownProps,
    };
  },
  options: {
    variables: { id: '21' },
  },
})(NewGroup);
