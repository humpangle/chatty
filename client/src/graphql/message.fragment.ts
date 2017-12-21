import gql from 'graphql-tag';

export const MESSAGE_FRAGMENT = gql`
  fragment MessageFragment on Message {
    id
    from {
      id
      username
    }
    createdAt
    text
  }
`;

export default MESSAGE_FRAGMENT;
