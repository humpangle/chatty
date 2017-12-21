import * as React from 'react';
import { TextInput, TextInputProperties, View } from 'react-native';

import { sendBtn, styles } from './input-commons.component';

interface CreateGroupInputProps {
  send: (text: string) => void;
}

class CreateGroupInput extends React.Component<CreateGroupInputProps> {
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
            placeholder="Type group name here!"
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

export default CreateGroupInput;
