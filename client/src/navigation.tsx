import * as React from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import {
  addNavigationHelpers,
  NavigationActions,
  NavigationDispatch,
  NavigationStackAction,
  NavigationState,
  StackNavigator,
  TabNavigator,
} from 'react-navigation';
import { connect } from 'react-redux';
import Groups from './screens/groups.screen';
import Messages from './screens/messages.screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    justifyContent: 'center',
  },
  selected: {
    color: 'blue',
  },
});

const TestScreen = (title: string) => () => (
  <View style={styles.container}>
    <Text>{title}</Text>
  </View>
);

const MainScreenNavigator = TabNavigator({
  Chats: {
    screen: Groups,
    navigationOptions: {
      tabBarLabel: 'Chats',
    },
  },
  Settings: {
    screen: TestScreen('Settings'),
    navigationOptions: {
      tabBarLabel: 'Settings',
    },
  },
});

const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Messages: { screen: Messages },
});

const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(
  firstAction,
  undefined
);
const initialNavState = AppNavigator.router.getStateForAction(
  tempNavState,
  undefined
);

export const navigationReducer = (
  state = initialNavState,
  action: { type: string }
) => AppNavigator.router.getStateForAction(action, state) || state;

interface State {
  nav: NavigationState;
}

interface StateProps {
  nav: NavigationState;
}

interface OwnProps {
  dispatch: NavigationDispatch<NavigationStackAction>;
}

class AppWithNavigationState extends React.Component<StateProps & OwnProps> {
  componentDidMount() {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    }
  }

  componentWillUnMount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    }
  }

  onBackPress = () => {
    const { dispatch, nav } = this.props;

    if (nav.index === 0) {
      return false;
    }

    dispatch(NavigationActions.back());
    return true;
  };

  render() {
    const { dispatch, nav } = this.props;

    return (
      <AppNavigator
        navigation={addNavigationHelpers({ dispatch, state: nav })}
      />
    );
  }
}

export default connect<StateProps, OwnProps, {}, State>(({ nav }) => {
  return { nav };
})(AppWithNavigationState);
