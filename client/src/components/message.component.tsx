import moment from 'moment';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageType } from '../graphql/types.query';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  message: {
    flex: 0.8,
    backgroundColor: 'white',
    borderRadius: 6,
    marginHorizontal: 16,
    marginVertical: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowRadius: 1,
    shadowOffset: {
      height: 1,
      width: 0,
    },
    elevation: 5,
  },
  myMessage: {
    backgroundColor: '#dcf8c6',
    borderColor: '#77f414',
  },
  messageUsername: {
    color: 'red',
    fontWeight: 'bold',
    paddingBottom: 12,
  },
  messageTime: {
    color: '#8c8c8c',
    fontSize: 11,
    textAlign: 'right',
  },
  messageSpacer: {
    flex: 0.2,
  },
  messageSpacerRight: {
    flex: 0.05,
  },
});

interface MessageProps {
  color: string;
  message: MessageType;
  isCurrentUser: boolean;
}

class Message extends React.PureComponent<MessageProps> {
  render() {
    const { color, message, isCurrentUser } = this.props;

    return (
      <View key={message.id} style={styles.container}>
        {isCurrentUser && <View style={styles.messageSpacer} />}
        <View style={[styles.message, isCurrentUser && styles.myMessage]}>
          <Text style={[styles.messageUsername, { color }]}>
            {message.from.username}
          </Text>
          <Text>{message.text}</Text>
          <Text style={styles.messageTime}>
            {moment(message.createdAt).format('h:mm A')}
          </Text>
        </View>
      </View>
    );
  }
}

export default Message;
