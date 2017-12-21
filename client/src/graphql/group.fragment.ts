import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';

export const GROUP_FRAGMENT = gql`
  fragment GroupFragment on Group {
    id
    name
    users {
      id
      username
    }
    messages {
      ...MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default GROUP_FRAGMENT;
