import * as React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TextInput,
  TextInputProperties,
  View,
} from 'react-native';
import Icon from 'samba6-vector-icons/FontAwesome';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    backgroundColor: '#f5f1ee',
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#dbdbdb',
    borderRadius: 15,
    borderWidth: 1,
    color: 'black',
    height: 32,
    paddingHorizontal: 8,
  },
  sendButtonContainer: {
    paddingRight: 12,
    paddingVertical: 6,
    // flexDirection: 'row-reverse',
  },
  sendButton: {
    height: 32,
    width: 32,
  },
  iconStyle: {
    marginRight: 0, // default is 12
  },
});

type SendEvent = (event: GestureResponderEvent) => void;

const sendBtn = (send: SendEvent) => (
  <Icon.Button
    name="send"
    backgroundColor="#304cff"
    borderRadius={16}
    color="white"
    iconStyle={styles.iconStyle}
    onPress={send}
    size={16}
    style={styles.sendButton}
  />
);

interface MessageInputProps {
  send: (text: string) => void;
}

class MessageInput extends React.Component<MessageInputProps> {
  state: {
    text: string;
  };

  textInput: TextInput;

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={this.makeRef}
            onChangeText={this.setText}
            style={styles.input}
            placeholder="Type your message here!"
          />
        </View>
        <View style={styles.sendButtonContainer}>{sendBtn(this.send)}</View>
      </View>
    );
  }

  private setText = (text: string) => this.setState({ text });

  private send = () => {
    this.props.send(this.state.text);
    this.textInput.clear();
    this.textInput.blur();
  };

  private makeRef = (c: React.Component<TextInputProperties> & TextInput) =>
    (this.textInput = c);
}

export default MessageInput;
