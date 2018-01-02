import gql from 'graphql-tag';

import MessageFragment from './message.fragment';

export const MessageEdgeFragment = gql`
  fragment MessageEdgeFragment on MessageEdge {
    cursor
    node {
      ...MessageFragment
    }
  }
  ${MessageFragment}
`;

export default MessageEdgeFragment;
