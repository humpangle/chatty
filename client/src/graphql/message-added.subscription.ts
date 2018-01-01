import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';

export const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription MessageAddedSubscription($groupIds: [ID]) {
    messageAdded(groupIds: $groupIds) {
      ...MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default MESSAGE_ADDED_SUBSCRIPTION;
