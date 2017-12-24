export const Schema = [
  `
  scalar Date

  type Group {
    id: ID!
    name: String
    users: [User]!
    messages: [Message]
  }

  type User {
    id: ID!
    email: String!
    username: String
    messages: [Message]
    groups: [Group]
    friends: [User]
  }

  type Message {
    id: ID!
    to: Group!
    from: User!
    text: String!
    createdAt: Date!
  }

  type Query {
    user(email: String, id: ID): User

    users: [User]

    messages(groupId: ID, userId: ID): [Message]

    group(id: ID!): Group

    groups: [Group]
  }

  type Mutation {
    createMessage(text: String!, userId: ID!, groupId: ID!): Message

    createGroup(name: String!, userId: ID!): Group

    updateGroup(name: String!, id: ID!): Group
  }

  schema {
    query: Query
    mutation: Mutation
  }
`
];

export default Schema;
