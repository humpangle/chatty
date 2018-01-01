import gql from 'graphql-tag';
import UserGroupFragment from './user-group.fragment';
import UserFragment from './user.fragment';
import UserFriendFragment from './user-friend.fragment';

export const USER_QUERY = gql`
  query User($id: ID, $messageConnection: ConnectionInput = { first: 1 }) {
    user(id: $id) {
      ...UserFragment
      groups {
        ...UserGroupFragment
      }
      friends {
        ...UserFriendFragment
      }
    }
  }

  ${UserFragment}
  ${UserGroupFragment}
  ${UserFriendFragment}
`;

export default USER_QUERY;
