import gql from 'graphql-tag';
import MessageEdgeFragment from './message-edge.fragment';

const GroupUserFragment = gql`
  fragment GroupUserFragment on User {
    id
    username
  }
`;

export const GROUP_FRAGMENT = gql`
  fragment GroupFragment on Group {
    id
    name
    unreadCount
    lastRead {
      id
      createdAt
    }
    users {
      ...GroupUserFragment
    }
    messages(messageConnection: $messageConnection) {
      edges {
        ...MessageEdgeFragment
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${GroupUserFragment}
  ${MessageEdgeFragment}
`;

export default GROUP_FRAGMENT;
