import gql from 'graphql-tag';

export const USER_QUERY = gql`
  query user($id: ID) {
    user(id: $id) {
      id
      email
      username
      groups {
        id
        name
      }
    }
  }
`;

export default USER_QUERY;
