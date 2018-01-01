import update from 'immutability-helper';
import * as React from 'react';
import { ChildProps, compose, graphql, QueryProps } from 'react-apollo';
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NavigationActions,
  NavigationNavigatorProps,
  NavigationScreenProp,
} from 'react-navigation';
import SelectedUserList from '../components/selected-user-list.component';
import CREATE_GROUP_MUTATION from '../graphql/create-group.mutation';

import USER_QUERY from '../graphql/user.query';
import { connect } from 'react-redux';
import { ReduxState, getUser } from '../reducers/auth.reducer';
import {
  UserFriendFragmentFragment,
  UserQuery,
  UserGroupFragmentFragment,
  UserQueryVariables,
  CreateGroupMutation,
} from '../graphql/operation-result-types';
import {
  CreateGroupMutationFunc,
  CreateGroupMutationProps,
} from '../graphql/operation-graphql-types';

const goToNewGroup = ({ id, name }: UserGroupFragmentFragment) =>
  NavigationActions.reset({
    index: 1,
    actions: [
      NavigationActions.navigate({ routeName: 'Main' }),
      NavigationActions.navigate({
        routeName: 'Messages',
        params: {
          groupId: id,
          title: name,
        },
      }),
    ],
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  imageContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  input: {
    color: '#000',
    height: 32,
  },
  inputBorder: {
    borderColor: '#dbdbdb',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  inputInstructions: {
    paddingTop: 6,
    color: '#777',
    fontSize: 12,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  selected: {
    flexDirection: 'row',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: '#00f',
    fontSize: 18,
    paddingTop: 2,
  },
  participants: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
});

interface NavigationState {
  params: {
    mode: string;
    create: () => undefined;
    selected: UserFriendFragmentFragment[];
    friendCount: number;
  };
}

type NavigatorProps = NavigationNavigatorProps<NavigationState>;

interface FinalizeGroupState {
  selected: UserFriendFragmentFragment[];
  name?: string;
}

interface OwnProps {
  navigation: NavigationScreenProp<NavigationState, {}>;
  selected?: UserFriendFragmentFragment[];
}

type UserQueryWithData = QueryProps<UserQueryVariables> & UserQuery;

interface FromReduxState {
  id: string;
}

type InputProps = OwnProps &
  UserQueryWithData &
  CreateGroupMutationProps &
  FromReduxState;

type FinalizeGroupProps = ChildProps<
  InputProps,
  UserQuery & CreateGroupMutation
>;

class FinalizeGroup extends React.Component<FinalizeGroupProps> {
  static navigationOptions = ({ navigation }: NavigatorProps) => {
    let isReady = false;
    let onPress = () => void 0;

    if (navigation) {
      const { state } = navigation;
      isReady = !!(state.params && state.params.mode === 'ready');
      onPress =
        state.params && state.params.create ? state.params.create : onPress;
    }

    return {
      title: 'New Group',
      headerRight: isReady && <Button title="Create" onPress={onPress} />,
    };
  };

  state: FinalizeGroupState;

  constructor(props: FinalizeGroupProps) {
    super(props);

    this.state = {
      selected:
        props.navigation && props.navigation.state.params
          ? props.navigation.state.params.selected
          : [],
    };
  }

  componentDidMount() {
    this.refreshNavigation(!!(this.state.selected.length && this.state.name));
  }

  componentWillUpdate(_: FinalizeGroupProps, nextState: FinalizeGroupState) {
    if (
      this.state.selected.length !== nextState.selected.length ||
      this.state.name !== nextState.name
    ) {
      this.refreshNavigation(!!(nextState.selected.length && nextState.name));
    }
  }

  render() {
    const { friendCount } = this.props.navigation.state.params;
    const { selected } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.imageContainer}>
            <Image
              style={styles.groupImage}
              source={{
                uri: 'https://facebook.github.io/react/img/logo_og.png',
              }}
            />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <View style={styles.inputBorder}>
              <TextInput
                autoFocus={true}
                onChangeText={this.setName}
                placeholder="Group Subject"
                style={styles.input}
              />
            </View>

            <Text style={styles.inputInstructions}>
              Please provide a group subject and optional group icon
            </Text>
          </View>
        </View>

        <Text style={styles.participants}>
          {`PARTICIPANTS: ${selected.length} OF ${friendCount}`}
        </Text>
        <View style={styles.selected}>
          {selected.length ? (
            <SelectedUserList data={selected} remove={this.remove} />
          ) : (
            undefined
          )}
        </View>
      </View>
    );
  }

  private setName = (name: string) =>
    this.setState(previousState => ({
      ...previousState,
      name,
    }));

  // private pop = () => this.props.navigation.goBack();

  private remove = (user: UserFriendFragmentFragment) => {
    const index = this.state.selected.indexOf(user);

    if (index !== -1) {
      this.setState(previousState =>
        update(previousState, { selected: { $splice: [[index, 1]] } })
      );
    }
  };

  private create = async () => {
    const { createGroup, navigation } = this.props;
    const { name, selected } = this.state;
    const alert = (msg: string) =>
      Alert.alert('Error Creating New Group', msg, [
        {
          text: 'OK',
          onPress: () => undefined,
        },
      ]);

    if (!(name && selected.length)) {
      return alert('Please type group name and select users.');
    }

    try {
      const { data } = await createGroup(name, selected.map(s => s.id));
      return (
        data.createGroup && navigation.dispatch(goToNewGroup(data.createGroup))
      );
    } catch (error) {
      return alert(error.message);
    }
  };

  private refreshNavigation = (ready: boolean) =>
    this.props.navigation.setParams({
      mode: ready ? 'ready' : undefined,
      create: this.create,
    });
}

export default compose(
  connect<FromReduxState, {}, {}, ReduxState>(state => ({
    id: getUser(state).id,
  })),

  graphql<UserQuery, InputProps>(USER_QUERY, {
    options: ({ id }) => {
      return {
        variables: {
          id,
        },
      };
    },

    props: props => {
      const data = props.data as UserQueryWithData;
      const { loading, error, user } = data;
      return { loading, error, user };
    },
  }),

  graphql<CreateGroupMutation, InputProps>(CREATE_GROUP_MUTATION, {
    props: props => {
      const mutate = props.mutate as CreateGroupMutationFunc;
      const { id } = props.ownProps;

      return {
        createGroup(name: string, userIds: string[]) {
          return mutate({
            variables: {
              group: {
                name,
                userIds,
              },
            },

            update(store, { data: newData }) {
              if (!newData) {
                return;
              }

              const data = store.readQuery({
                query: USER_QUERY,
                variables: {
                  id,
                },
              }) as UserQueryWithData;

              const newGroup = newData.createGroup;

              if (
                !(newGroup.id && data.user && data.user.groups) ||
                data.user.groups.some(g => (g && g.id) === newGroup.id)
              ) {
                return;
              }

              const updatedData = update(data, {
                user: {
                  groups: {
                    $push: [newGroup],
                  },
                },
              });

              store.writeQuery({
                query: USER_QUERY,
                variables: {
                  id,
                },
                data: updatedData,
              });
            },
          });
        },
      };
    },
  })
)(FinalizeGroup);
