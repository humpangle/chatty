import gql from 'graphql-tag';
import UserGroupFragment from './user-group.fragment';

export const USER_QUERY = gql`
  query user($id: ID) {
    user(id: $id) {
      id
      email
      username
      groups {
        ...UserGroupFragment
      }
      friends {
        id
        username
      }
    }
  }

  ${UserGroupFragment}
`;

export default USER_QUERY;
