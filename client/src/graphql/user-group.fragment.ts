import gql from 'graphql-tag';
import MessageEdgeFragment from './message-edge.fragment';

export const UserGroupFragment = gql`
  fragment UserGroupFragment on Group {
    id
    name
    unreadCount
    messages(messageConnection: $messageConnection) {
      edges {
        ...MessageEdgeFragment
      }
    }
  }

  ${MessageEdgeFragment}
`;

export default UserGroupFragment;
