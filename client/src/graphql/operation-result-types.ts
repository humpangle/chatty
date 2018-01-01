/* tslint:disable */
//  This file was automatically generated and should not be edited.

export interface CreateGroupInput {
  name: string,
  userIds?: Array< string > | null,
};

export interface ConnectionInput {
  first?: number | null,
  after?: string | null,
  last?: number | null,
  before?: string | null,
};

export interface CreateMessageInput {
  groupId: string,
  text: string,
};

export interface SigninUserInput {
  email: string,
  password: string,
  username?: string | null,
};

export interface CreateGroupMutationVariables {
  group: CreateGroupInput,
  messageConnection?: ConnectionInput | null,
};

export interface CreateGroupMutation {
  createGroup:  {
    id: string,
    name: string | null,
    messages:  {
      edges:  Array< {
        cursor: string,
        node:  {
          id: string,
          from:  {
            id: string,
            username: string | null,
          },
          createdAt: string,
          text: string,
          to:  {
            id: string,
          },
        },
      } | null > | null,
    } | null,
  } | null,
};

export interface CreateMessageMutationVariables {
  message: CreateMessageInput,
};

export interface CreateMessageMutation {
  createMessage:  {
    id: string,
    from:  {
      id: string,
      username: string | null,
    },
    createdAt: string,
    text: string,
    to:  {
      id: string,
    },
  } | null,
};

export interface GroupAddedSubscriptionSubscriptionVariables {
  messageConnection?: ConnectionInput | null,
};

export interface GroupAddedSubscriptionSubscription {
  groupAdded:  {
    id: string,
    name: string | null,
    messages:  {
      edges:  Array< {
        cursor: string,
        node:  {
          id: string,
          from:  {
            id: string,
            username: string | null,
          },
          createdAt: string,
          text: string,
          to:  {
            id: string,
          },
        },
      } | null > | null,
    } | null,
  } | null,
};

export interface GroupQueryVariables {
  id: string,
  messageConnection?: ConnectionInput | null,
};

export interface GroupQuery {
  group:  {
    id: string,
    name: string | null,
    users:  Array< {
      id: string,
      username: string | null,
    } | null >,
    messages:  {
      edges:  Array< {
        cursor: string,
        node:  {
          id: string,
          from:  {
            id: string,
            username: string | null,
          },
          createdAt: string,
          text: string,
          to:  {
            id: string,
          },
        },
      } | null > | null,
      pageInfo:  {
        hasNextPage: boolean,
        hasPreviousPage: boolean,
      },
    } | null,
  } | null,
};

export interface LoginMutationVariables {
  user: SigninUserInput,
};

export interface LoginMutation {
  login:  {
    id: string,
    jwt: string | null,
    username: string | null,
  } | null,
};

export interface MessageAddedSubscriptionSubscriptionVariables {
  groupIds?: Array< string | null > | null,
};

export interface MessageAddedSubscriptionSubscription {
  messageAdded:  {
    id: string,
    from:  {
      id: string,
      username: string | null,
    },
    createdAt: string,
    text: string,
    to:  {
      id: string,
    },
  } | null,
};

export interface SignupMutationVariables {
  user: SigninUserInput,
};

export interface SignupMutation {
  signup:  {
    id: string,
    jwt: string | null,
    username: string | null,
  } | null,
};

export interface UserQueryVariables {
  id?: string | null,
  messageConnection?: ConnectionInput | null,
};

export interface UserQuery {
  user:  {
    id: string,
    email: string,
    username: string | null,
    groups:  Array< {
      id: string,
      name: string | null,
      messages:  {
        edges:  Array< {
          cursor: string,
          node:  {
            id: string,
            from:  {
              id: string,
              username: string | null,
            },
            createdAt: string,
            text: string,
            to:  {
              id: string,
            },
          },
        } | null > | null,
      } | null,
    } | null > | null,
    friends:  Array< {
      id: string,
      username: string | null,
    } | null > | null,
  } | null,
};

export interface GroupFragmentFragment {
  id: string,
  name: string | null,
  users:  Array< {
    id: string,
    username: string | null,
  } | null >,
  messages:  {
    edges:  Array< {
      cursor: string,
      node:  {
        id: string,
        from:  {
          id: string,
          username: string | null,
        },
        createdAt: string,
        text: string,
        to:  {
          id: string,
        },
      },
    } | null > | null,
    pageInfo:  {
      hasNextPage: boolean,
      hasPreviousPage: boolean,
    },
  } | null,
};

export interface MessageFragmentFragment {
  id: string,
  from:  {
    id: string,
    username: string | null,
  },
  createdAt: string,
  text: string,
  to:  {
    id: string,
  },
};

export interface UserFriendFragmentFragment {
  id: string,
  username: string | null,
};

export interface MessageEdgeFragmentFragment {
  cursor: string,
  node:  {
    id: string,
    from:  {
      id: string,
      username: string | null,
    },
    createdAt: string,
    text: string,
    to:  {
      id: string,
    },
  },
};

export interface UserGroupFragmentFragment {
  id: string,
  name: string | null,
  messages:  {
    edges:  Array< {
      cursor: string,
      node:  {
        id: string,
        from:  {
          id: string,
          username: string | null,
        },
        createdAt: string,
        text: string,
        to:  {
          id: string,
        },
      },
    } | null > | null,
  } | null,
};

export interface UserFragmentFragment {
  id: string,
  email: string,
  username: string | null,
};
