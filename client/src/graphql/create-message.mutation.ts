import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';

export const CREATE_MESSAGE_MUTATION = gql`
  mutation CreateMessage($text: String!, $groupId: ID!) {
    createMessage(text: $text, groupId: $groupId) {
      ...MessageFragment
    }
  }

  ${MESSAGE_FRAGMENT}
`;

export default CREATE_MESSAGE_MUTATION;
