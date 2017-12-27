import { Buffer } from 'buffer/';
import { MessageType } from './graphql/types.query';

export const messageToEdge = (message: MessageType) => ({
  __typename: 'MessageEdge',
  node: message,
  cursor: Buffer.from(message.id.toString()).toString('base64'),
});
