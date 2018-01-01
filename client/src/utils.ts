import { Buffer } from 'buffer/';
import { MessageFragmentFragment } from './graphql/operation-result-types';

export const messageToEdge = (message: MessageFragmentFragment) => ({
  __typename: 'MessageEdge',
  node: message,
  cursor: Buffer.from(message.id.toString()).toString('base64'),
});
