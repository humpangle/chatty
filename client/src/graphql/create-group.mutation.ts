import gql from 'graphql-tag';
import UserGroupFragment from './user-group.fragment';

export const CREATE_GROUP_MUTATION = gql`
  mutation CreateGroup($name: String!, $userId: ID!, $userIds: [ID!]) {
    createGroup(name: $name, userId: $userId, userIds: $userIds) {
      ...UserGroupFragment
    }
  }

  ${UserGroupFragment}
`;

export default CREATE_GROUP_MUTATION;
