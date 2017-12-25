export interface UserQuery {
  user: UserType;
}

export interface UserType {
  id: string;
  email: string;
  username: string;
  groups: UserGroupType[];
}

export interface UserGroupType {
  id: string;
  name: string;
  users: UserType[];
  messages: MessageType[];
}

export type UserWithFriendsType = UserType & {
  friends?: UserType[];
};

export interface GroupQuery {
  group: GroupType;
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

export interface CreateGroupMutation {
  createGroup: GroupType;
}

export interface CreateGroupMutationVariables {
  name: string;
  userId: string;
}
