import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';

export const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription MessageAddedSubscription($userId: ID!, $groupIds: [ID]) {
    messageAdded(userId: $userId, groupIds: $groupIds) {
      ...MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default MESSAGE_ADDED_SUBSCRIPTION;
