import { makeExecutableSchema } from "graphql-tools";
import { Resolvers } from "./resolvers";

export const Schema = [
  `
    scalar Date

    type Group {
      id: ID!
      name: String
      users: [User]!
      messages(
        first: Int
        after: String
        last: Int
        before: String
      ): MessageConnection
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
      createMessage(text: String!, groupId: ID!): Message
      createGroup(name: String!, userIds: [ID!]): Group
      updateGroup(name: String!, id: ID!): Group
      leaveGroup(id: ID!): Group
      deleteGroup(id: ID!): Group
      login(email: String!, password: String!): User
      signup(email: String!, password: String!, username: String): User
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
