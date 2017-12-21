import gql from 'graphql-tag';

export const GROUP_QUERY = gql`
  query group($groupId: ID!) {
    group(id: $groupId) {
      id
      name
      users {
        id
        username
      }
      messages {
        id
        from {
          id
          username
        }
        createdAt
        text
      }
    }
  }
`;

export default GROUP_QUERY;
