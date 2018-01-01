import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  AlertButton,
} from 'react-native';
import { NavigationScreenProp, NavigationActions } from 'react-navigation';
import { graphql, compose, ChildProps } from 'react-apollo';
import { connect } from 'react-redux';
import {
  setCurrentUser,
  SetCurrentUserActionFunc,
} from '../actions/auth.actions';
import LOGIN_MUTATION from '../graphql/login.mutation';
import SIGNUP_MUTATION from '../graphql/signup.mutation';
import { getUser, ReduxState } from '../reducers/auth.reducer';
import {
  LoginMutationProps,
  SignupMutationProps,
  SignupMutation,
  LoginMutation,
  LoginMutationFunc,
  SignupMutationFunc,
  AuthMutationVariables,
} from '../graphql/types.query';
import { CheckBox } from 'react-native-elements';

const capitalizeFirstLetter = (text: string) =>
  text[0].toUpperCase() + text.slice(1);

const resetAction = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Main' })],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#eeeeee',
    paddingHorizontal: 50,
  },

  inputContainer: {
    marginBottom: 20,
  },

  input: {
    height: 40,
    borderRadius: 4,
    marginVertical: 6,
    padding: 6,
  },

  loadingIndicator: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },

  switchAction: {
    paddingHorizontal: 4,
    color: 'blue',
  },

  submit: {
    marginVertical: 6,
  },
});

interface NavigationState {
  params: {};
}

enum StateView {
  LOGIN = 'login',
  SIGNUP = 'signup',
}

interface SigninState {
  view: StateView;
  loading: boolean;
  email?: string;
  password?: string;
  revealPassword: boolean;
}

interface FromReduxState {
  jwt: string;
}

interface FromReduxDispatch {
  setCurrentUser: SetCurrentUserActionFunc;
}

interface OwnProps {
  navigation?: NavigationScreenProp<NavigationState, {}>;
}

type InputProps = OwnProps &
  FromReduxState &
  FromReduxDispatch &
  SignupMutationProps &
  LoginMutationProps;

type SigninProps = ChildProps<InputProps, SignupMutation & LoginMutation>;

class Signin extends React.PureComponent<SigninProps> {
  static navigationOptions = {
    title: 'Chatty',
    headerLeft: null,
  };

  state: SigninState;

  constructor(props: InputProps) {
    super(props);
    this.state = {
      view: StateView.LOGIN,
      loading: false,
      revealPassword: false,
    };
  }

  componentWillReceiveProps(nextProps: InputProps) {
    if (nextProps.jwt && nextProps.navigation) {
      nextProps.navigation.dispatch(resetAction);
    }
  }

  render() {
    const { view, email, password } = this.state;

    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        {this.state.loading ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator />
          </View>
        ) : (
          undefined
        )}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            onChangeText={this.setEmail}
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            onChangeText={this.setPassword}
            style={styles.input}
            secureTextEntry={!this.state.revealPassword}
          />

          <CheckBox
            title="Reveal Password"
            checked={this.state.revealPassword}
            onIconPress={this.toggleRevealPassword}
          />
        </View>

        <View style={styles.submit}>
          <Button
            onPress={this.doAuth}
            title={view === StateView.SIGNUP ? 'Sign up' : 'Login'}
            disabled={this.state.loading || !(email && password)}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text>
            {view === StateView.SIGNUP
              ? 'Already have an account?'
              : 'New to Chatty?'}
          </Text>
          <TouchableOpacity onPress={this.switchView}>
            <Text style={styles.switchAction}>
              {view === StateView.LOGIN ? 'Sign up' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  toggleRevealPassword = () =>
    this.setState((previous: SigninState) => ({
      ...previous,
      revealPassword: !previous.revealPassword,
    }));

  doAuth = async () => {
    this.setState({ loading: true });
    const { email, password, view } = this.state;

    if (!(email && password)) {
      return this.raiseAlert('You must supply email and password');
    }

    try {
      const { errors, data } = await this.props[view]({
        email,
        password,
      });

      if (errors) {
        return this.raiseAlert('Something went wrong!');
      }

      const user = data[view];
      this.props.setCurrentUser(user);

      this.setState({ loading: false });
    } catch (error) {
      this.setState({ loading: false });
      return this.raiseAlert(error.message);
    }
  };

  private switchView = () => {
    this.setState({
      view:
        this.state.view === StateView.SIGNUP
          ? StateView.LOGIN
          : StateView.SIGNUP,
    });
  };

  private setEmail = (email: string) => this.setState({ email });

  private setPassword = (password: string) => this.setState({ password });

  private raiseAlert = (msg: string) => {
    let buttons: AlertButton[] = [
      {
        text: 'OK',
        onPress: () => console.log('Ok pressed'),
      },
    ];

    buttons =
      this.state.view === StateView.LOGIN
        ? buttons
        : [
            ...buttons,
            {
              text: 'Forgot password?',
              onPress: () => console.log('Forgot password pressed'),
              style: 'cancel',
            },
          ];

    Alert.alert(
      `${capitalizeFirstLetter(this.state.view)} Error`,
      msg,
      buttons
    );
  };
}

export default compose(
  connect<FromReduxState, FromReduxDispatch, OwnProps, ReduxState>(
    state => ({ jwt: getUser(state).jwt }),
    {
      setCurrentUser,
    }
  ),

  graphql<LoginMutation, InputProps>(LOGIN_MUTATION, {
    props: props => {
      const mutate = props.mutate as LoginMutationFunc;

      return {
        login: (params: AuthMutationVariables) =>
          mutate({
            variables: params,
          }),
      };
    },
  }),

  graphql<SignupMutation, InputProps>(SIGNUP_MUTATION, {
    props: props => {
      const mutate = props.mutate as SignupMutationFunc;

      return {
        signup: (params: AuthMutationVariables) =>
          mutate({
            variables: params,
          }),
      };
    },
  })
)(Signin);
