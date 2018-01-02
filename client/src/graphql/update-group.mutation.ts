import gql from 'graphql-tag';

export const UPDATE_GROUP_MUTATION = gql`
  mutation UpdateGroup($group: UpdateGroupInput!) {
    updateGroup(group: $group) {
      id
      name
      lastRead {
        id
        createdAt
      }
    }
  }
`;

export default UPDATE_GROUP_MUTATION;
