import { makeExecutableSchema } from "graphql-tools";
import { Resolvers } from "./resolvers";

export const Schema = [
  `
    scalar Date

    input CreateMessageInput {
      groupId: ID!
      text: String!
    }

    input CreateGroupInput {
      name: String!
      userIds: [ID!]
    }

    input UpdateGroupInput {
      id: ID!
      name: String
      userIds: [ID!]
      lastRead: ID
    }

    input SigninUserInput {
      email: String!
      password: String!
      username: String
    }

    input UpdateUserInput {
      username: String
    }

    input ConnectionInput {
      first: Int
      after: String
      last: Int
      before: String
    }

    # input for updating groups
    input updateGroupInput {
      id: ID!
      lastRead: ID
      name: String
      userIds: [ID!]
    }

    type Group {
      id: ID!
      name: String
      users: [User]!
      messages(messageConnection: ConnectionInput): MessageConnection
      lastRead: Message # message last read by user
      unreadCount: Int # number of unread messages by user
    }

    type User {
      id: ID!
      email: String!
      username: String
      messages: [Message]
      groups: [Group]
      friends: [User]
      jwt: String
    }

    type Message {
      id: ID!
      to: Group!
      from: User!
      text: String!
      createdAt: Date!
    }

    type MessageConnection {
      edges: [MessageEdge]
      pageInfo: PageInfo!
    }

    type MessageEdge {
      cursor: String!
      node: Message!
    }

    type PageInfo {
      hasNextPage: Boolean!
      hasPreviousPage: Boolean!
    }

    type Query {
      user(email: String, id: ID): User

      users: [User]

      messages(groupId: ID, userId: ID): [Message]

      group(id: ID!): Group

      groups: [Group]
    }

    type Mutation {
      createMessage(message: CreateMessageInput!): Message
      createGroup(group: CreateGroupInput!): Group
      updateGroup(group: UpdateGroupInput!): Group
      leaveGroup(id: ID!): Group
      deleteGroup(id: ID!): Group
      login(user: SigninUserInput): User
      signup(user: SigninUserInput): User
    }

    type Subscription {
      messageAdded(groupIds: [ID]): Message
      groupAdded: Group
    }

    schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }
  `
];

export const executableSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: Resolvers
});

export default executableSchema;
