import gql from 'graphql-tag';

export const UserFragment = gql`
  fragment UserFragment on User {
    id
    email
    username
  }
`;
export default UserFragment;
