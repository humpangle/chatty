import update from 'immutability-helper';
import _groupBy from 'lodash-es/groupBy';
import _keys from 'lodash-es/keys';
import * as React from 'react';
import { ChildProps, compose, graphql, MutationFunc } from 'react-apollo';
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
import { connect } from 'react-redux';
import Icon from 'samba6-vector-icons/FontAwesome';
import SelectedUserList from '../components/selected-user-list.component';
import { UserType, UserTypeWithFriends } from '../graphql/types.query';
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
    this.setState(prevState => ({
      ...prevState,
      isSelected: nextProps.isSelected(nextProps.item),
    }));
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
    finalizeGroup: () => void;
    selected: UserTypeWithFriends[];
  };
}

type NavigationProps = NavigationScreenProp<NavigationState, {}>;
type NavigatorProps = NavigationNavigatorProps<NavigationState>;

type SelectedUsers = UserTypeWithFriends[];

interface OwnProps {
  navigation: NavigationScreenProp<NavigationState, {}>;
  user?: UserTypeWithFriends;
  selected?: SelectedUsers;
  loading: boolean;
}

interface NewGroupState {
  selected?: SelectedUsers;
  friends?: { [key: string]: UserType[] };
}

// tslint:disable-next-line:max-classes-per-file
class NewGroup extends React.Component<OwnProps> {
  static navigationOptions = (options: NavigatorProps) => {
    const navigation = options.navigation as NavigationProps;
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';

    return {
      title: 'New Group',
      headerRight: isReady && (
        <Button title="Next" onPress={state.params.finalizeGroup} />
      ),
    };
  };

  state: NewGroupState;

  constructor(props: OwnProps) {
    super(props);
    this.state = {
      selected: props.navigation.state.params
        ? props.navigation.state.params.selected
        : [],
      friends:
        props.user && props.user.friends
          ? _groupBy<UserType>(props.user.friends, friend =>
              friend.username.charAt(0).toLocaleUpperCase()
            )
          : {},
    };
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected || []);
  }

  componentWillReceiveProps(nextProps: OwnProps) {
    const state: NewGroupState = {};

    if (
      nextProps.user &&
      nextProps.user.friends &&
      nextProps.user !== this.props.user
    ) {
      state.friends = sortObj(
        _groupBy(nextProps.user.friends, friend =>
          friend.username.charAt(0).toLocaleUpperCase()
        )
      );
    }

    this.setState({
      ...state,
      selected: nextProps.selected ? nextProps.selected : [],
    });
  }

  componentWillUpdate(_: OwnProps, nextState: NewGroupState) {
    if (
      nextState.selected &&
      this.state.selected &&
      nextState.selected.length !== this.state.selected.length
    ) {
      this.refreshNavigation(nextState.selected);
    }
  }

  render() {
    const { user, loading } = this.props;

    if (loading && !user) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    const data = this.state.friends as { [key: string]: UserType[] };

    return (
      <View style={styles.container}>
        {this.state.selected &&
          this.state.selected.length && (
            <View style={styles.selected}>
              <SelectedUserList
                data={this.state.selected}
                remove={this.toggle}
              />
            </View>
          )}

        {_keys(this.state.friends).length && (
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
        )}
      </View>
    );
  }

  refreshNavigation = (selected: SelectedUsers) => {
    this.props.navigation.setParams({
      mode: selected && selected.length ? 'ready' : undefined,
      finalizeGroup: this.finalizeGroup,
    });
  };

  finalizeGroup = () =>
    this.props.navigation.navigate('FinalizeGroup', {
      selected: this.state.selected || [],
      friendCount:
        (this.props.user &&
          this.props.user.friends &&
          this.props.user.friends.length) ||
        0,
      userId: (this.props.user && this.props.user.id) || '-1',
    });

  isSelected = (user: UserTypeWithFriends) => -this.getUserIndex(user) - 1;

  getUserIndex = (user: UserTypeWithFriends) =>
    (this.state.selected && this.state.selected.indexOf(user)) || -1;

  toggle = (user: UserTypeWithFriends) => {
    const index = this.getUserIndex(user);
    const selected = this.state.selected as UserTypeWithFriends[];

    this.setState(prevState => ({
      ...prevState,
      selected:
        index !== -1
          ? update(selected, { $splice: [[index, 1]] })
          : [...selected, user],
    }));
  };
}

export default NewGroup;
