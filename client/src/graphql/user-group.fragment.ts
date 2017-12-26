import gql from 'graphql-tag';
import MessageFragment from './message.fragment';

export const UserGroupFragment = gql`
  fragment UserGroupFragment on Group {
    id
    name
    messages(first: 1) {
      edges {
        cursor
        node {
          ...MessageFragment
        }
      }
    }
  }

  ${MessageFragment}
`;

export default UserGroupFragment;
