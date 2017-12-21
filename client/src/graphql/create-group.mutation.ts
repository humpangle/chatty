import gql from 'graphql-tag';

export const CREATE_GROUP_MUTATION = gql`
  mutation CreateGroup($name: String!, $userId: ID!) {
    createGroup(name: $name, userId: $userId) {
      id
      name
    }
  }
`;

export default CREATE_GROUP_MUTATION;
