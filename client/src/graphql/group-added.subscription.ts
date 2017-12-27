import gql from 'graphql-tag';
import UserGroupFragment from './user-group.fragment';

export const GROUP_ADDED_SUBSCRIPTION = gql`
  subscription GroupAddedSubscription($userId: ID!) {
    groupAdded(userId: $userId) {
      ...UserGroupFragment
    }
  }

  ${UserGroupFragment}
`;

export default GROUP_ADDED_SUBSCRIPTION;
