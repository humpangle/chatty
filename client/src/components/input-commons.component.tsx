import * as React from 'react';
import { GestureResponderEvent, StyleSheet } from 'react-native';
import Icon from 'samba6-vector-icons/FontAwesome';

export const styles = StyleSheet.create({
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

export const sendBtn = (send: SendEvent) => (
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
