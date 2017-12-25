import gql from 'graphql-tag';
import GROUP_FRAGMENT from './group.fragment';

export const GROUP_QUERY = gql`
  query group(
    $groupId: ID!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    group(id: $groupId) {
      ...GroupFragment
    }
  }
  ${GROUP_FRAGMENT}
`;

export default GROUP_QUERY;
