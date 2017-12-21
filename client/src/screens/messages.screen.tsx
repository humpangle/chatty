import randomColor from 'randomcolor';
import * as React from 'react';
import { ChildProps, graphql, QueryProps } from 'react-apollo';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { NavigationNavigatorProps, NavigationProp } from 'react-navigation';
import Message from '../components/message.component';
import { GROUP_QUERY } from '../graphql/group.query';
import { GroupQuery, GroupType, MessageType } from '../graphql/types.query';

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#e5ddd5',
    flex: 1,
    flexDirection: 'column',
  },
  loading: {
    justifyContent: 'center',
  },
});

interface NavigationState {
  params: { title: string; groupId: string };
}

type NavigationProps = NavigationProp<NavigationState, {}>;
type NavigatorProps = NavigationNavigatorProps<NavigationState>;

type OwnProps = NavigatorProps & {
  loading: boolean;
  group: GroupType;
};

type GroupQueryWithData = GroupQuery & QueryProps;
type InputProps = OwnProps & GroupQueryWithData;
type MessagesProps = ChildProps<InputProps, GroupQuery>;

class Messages extends React.Component<MessagesProps> {
  static navigationOptions = (options: NavigatorProps) => {
    const navigation = options.navigation as NavigationProps;
    return { title: navigation.state.params.title };
  };

  state: {
    usernameColors: { [key: string]: string };
  } = {
    usernameColors: {},
  };

  componentWillReceiveProps(nextProps: MessagesProps) {
    if (nextProps.group && nextProps.group.users) {
      const usernameColors = { ...this.state.usernameColors };

      nextProps.group.users.forEach(({ username }) => {
        usernameColors[username] = usernameColors[username] || randomColor();
      });

      this.setState(prevState => {
        return { ...prevState, usernameColors };
      });
    }
  }

  render() {
    const { loading, group } = this.props;

    if (loading && !group) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={group.messages.slice().reverse()}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    );
  }

  keyExtractor = (item: MessageType) => item.id;

  renderItem = ({ item: message }: { item: MessageType; index: number }) => (
    <Message
      color={this.state.usernameColors[message.from.username]}
      isCurrentUser={message.from.id === '1'}
      message={message}
    />
  );
}

export default graphql<GroupQuery, InputProps>(GROUP_QUERY, {
  props: props => {
    const data = props.data as GroupQueryWithData;
    return data;
  },
  options: ownProps => {
    const navigation = ownProps.navigation as NavigationProps;
    return {
      variables: {
        groupId: navigation.state.params.groupId,
      },
    };
  },
})(Messages);
