import gql from 'graphql-tag';

const LOGIN_MUTATION = gql`
  mutation Login($user: SigninUserInput!) {
    login(user: $user) {
      id
      jwt
      username
    }
  }
`;

export default LOGIN_MUTATION;
