export interface UserType {
  id: string;
  email: string;
  username: string;
  groups: GroupType[];
}

export type UserTypeWithFriends = UserType & {
  friends?: UserType[];
};

export interface GroupType {
  id: string;
  name: string;
  users: UserType[];
  messages: MessageType[];
}

export interface MessageType {
  id: string;
  from: UserType;
  createdAt: string;
  text: string;
}

export interface UserQuery {
  user: UserType;
}

export interface GroupQuery {
  group: GroupType;
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
