import gql from 'graphql-tag';
import GROUP_FRAGMENT from './group.fragment';

export const GROUP_QUERY = gql`
  query Group($id: ID!, $messageConnection: ConnectionInput) {
    group(id: $id) {
      ...GroupFragment
    }
  }
  ${GROUP_FRAGMENT}
`;

export default GROUP_QUERY;
