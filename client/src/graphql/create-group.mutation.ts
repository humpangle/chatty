import gql from 'graphql-tag';
import UserGroupFragment from './user-group.fragment';

export const CREATE_GROUP_MUTATION = gql`
  mutation CreateGroup(
    $group: CreateGroupInput!
    $messageConnection: ConnectionInput = { first: 1 }
  ) {
    createGroup(group: $group) {
      ...UserGroupFragment
    }
  }

  ${UserGroupFragment}
`;

export default CREATE_GROUP_MUTATION;
