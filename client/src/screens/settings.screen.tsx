import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { compose, graphql, ChildProps } from 'react-apollo';
import USER_QUERY from '../graphql/user.query';
import { logout, LogoutActionFunc } from '../actions/auth.actions';
import { UserQueryWithData, UserQuery } from '../graphql/types.query';
import reactLogo from '../images/react.png';
import { ReduxState, getUser } from '../reducers/auth.reducer';
import { NavigationScreenProp, NavigationActions } from 'react-navigation';

const resetAction = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Signin' })],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  email: {
    borderColor: '#777',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 1,
  },

  emailHeader: {
    backgroundColor: '#dbdbdb',
    color: '#777',
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 32,
    fontSize: 12,
  },

  loading: {
    justifyContent: 'center',
    flex: 1,
  },

  userImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  imageContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },

  input: {
    color: 'black',
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
    flex: 1,
  },

  userContainer: {
    paddingLeft: 16,
  },

  userInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
  },
});

interface FromReduxState {
  userId: string;
}

interface FromReduxDispatch {
  logout: LogoutActionFunc;
}

interface NavigationState {
  params: {};
}

interface OwnProps {
  navigation?: NavigationScreenProp<NavigationState, {}>;
}

type InputProps = FromReduxState &
  FromReduxDispatch &
  UserQueryWithData &
  OwnProps;

type SettingsProps = ChildProps<InputProps, UserQuery>;

class Settings extends React.Component<SettingsProps> {
  static navigationOptions = {
    title: 'Settings',
  };

  render() {
    const { loading, user } = this.props;

    if (loading || !user) {
      return (
        <View style={[styles.container, styles.loading]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.userContainer}>
          <View style={styles.userInner}>
            <TouchableOpacity style={styles.imageContainer}>
              <Image style={styles.userImage} source={reactLogo} />
              <Text>edit</Text>
            </TouchableOpacity>
            <Text style={styles.inputInstructions}>
              Enter your name and add an optional profile picture
            </Text>
          </View>

          <View style={styles.inputBorder}>
            <TextInput
              style={styles.input}
              onChangeText={this.setUsername}
              placeholder={user.username}
              defaultValue={user.username}
            />
          </View>
        </View>
        <Text style={styles.emailHeader}>EMAIL</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Button title="Logout" onPress={this.logout} />
      </View>
    );
  }

  updateUsername = (username: string) => username;

  setUsername = (username: string) => this.setState({ username });

  logout = () => {
    this.props.logout();
    const { navigation } = this.props;

    if (navigation) {
      navigation.dispatch(resetAction);
    }
  };
}

export default compose(
  connect<FromReduxState, FromReduxDispatch, {}, ReduxState>(
    state => ({
      userId: getUser(state).id,
    }),
    { logout }
  ),

  graphql<UserQuery, FromReduxState>(USER_QUERY, {
    skip: ({ userId }) => !userId,

    props: ({ data }) => data,

    options: ({ userId: id }) => ({
      variables: { id },
      fetchPolicy: 'cache-only',
    }),
  })
)(Settings);
