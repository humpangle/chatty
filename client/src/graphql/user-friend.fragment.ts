import gql from 'graphql-tag';

export const UserFriendFragment = gql`
  fragment UserFriendFragment on User {
    id
    username
  }
`;

export default UserFriendFragment;
