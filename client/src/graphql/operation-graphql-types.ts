import { ApolloQueryResult } from 'apollo-client-preset';
import { MutationFunc, QueryProps } from 'react-apollo';
import {
  LoginMutationVariables,
  LoginMutation,
  SignupMutationVariables,
  SignupMutation,
  UserQueryVariables,
  UserQuery,
  CreateGroupMutation,
  CreateGroupMutationVariables,
  CreateMessageMutation,
  CreateMessageMutationVariables,
  GroupQueryVariables,
  GroupQuery,
} from './operation-result-types';

export type LoginMutationFunc = MutationFunc<
  LoginMutation,
  LoginMutationVariables
>;

export type LoginMutationProps = LoginMutationFunc & {
  login: (
    params: LoginMutationVariables
  ) => Promise<ApolloQueryResult<LoginMutation>>;
};

export type SignupMutationFunc = MutationFunc<
  SignupMutation,
  SignupMutationVariables
>;

export type SignupMutationProps = SignupMutationFunc & {
  signup: (
    params: SignupMutationVariables
  ) => Promise<ApolloQueryResult<SignupMutation>>;
};

export type UserQueryWithData = QueryProps<UserQueryVariables> & UserQuery;

export type CreateGroupMutationFunc = MutationFunc<
  CreateGroupMutation,
  CreateGroupMutationVariables
>;

export type CreateGroupMutationProps = CreateGroupMutationFunc & {
  createGroup: (
    name: string,
    userIds: string[]
  ) => Promise<ApolloQueryResult<CreateGroupMutation>>;
};

export type CreateMessageMutationFunc = MutationFunc<
  CreateMessageMutation,
  CreateMessageMutationVariables
>;

export type CreateMessageMutationProps = CreateMessageMutationFunc & {
  createMessage: (
    text: string
  ) => Promise<ApolloQueryResult<CreateMessageMutation>>;
};

export type GroupQueryWithData = QueryProps<GroupQueryVariables> & GroupQuery;
