import { ApolloQueryResult } from 'apollo-client-preset';
import { MutationFunc, QueryProps } from 'react-apollo';

export interface UserQuery {
  user: UserType;
}

export type UserQueryWithData = QueryProps<UserQueryVariables> & UserQuery;

export interface UserQueryVariables {
  id: string;
}

export interface UserType {
  id: string;
  email: string;
  username: string;
  groups: UserGroupType[];
  friends: UserFriendType[];
}

export interface UserGroupType {
  id: string;
  name: string;
  users: UserType[];
  messages: UserGroupMessageType;
}

export interface UserFriendType {
  id: string;
  username: string;
}

export interface UserGroupMessageType {
  edges: MessageEdge[];
}

export interface GroupQuery {
  group: GroupType;
}

export type GroupQueryWithData = QueryProps<GroupQueryVariables> & GroupQuery;

export interface GroupQueryVariables {
  groupId: string;
  first?: number;
  last?: number;
  after?: string;
  before?: string;
}

export interface GroupType {
  id: string;
  name: string;
  users: UserType[];
  messages: MessageConnection;
}

export interface MessageConnection {
  edges: MessageEdge[];
  pageInfo: PageInfo;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MessageEdge {
  cursor: string;
  node: MessageType;
}

export interface MessageType {
  id: string;
  from: UserType;
  createdAt: string;
  text: string;
}

export interface CreateMessageMutation {
  createMessage: MessageType;
}

export interface CreateMessageMutationVariables {
  text: string;
  userId: string;
  groupId: string;
}

export type CreateMessageMutationFunc = MutationFunc<
  CreateMessageMutation,
  CreateMessageMutationVariables
>;

export type CreateMessageMutationProps = CreateMessageMutationFunc & {
  createMessage: (
    params: CreateMessageParams
  ) => Promise<ApolloQueryResult<CreateMessageMutation>>;
};

export interface CreateMessageParams {
  text: string;
  userId: string;
}

export interface CreateGroupMutation {
  createGroup: UserGroupType;
}

export interface CreateGroupMutationVariables {
  name: string;
  userId: string;
  userIds: string[];
}
