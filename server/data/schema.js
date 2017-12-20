export const Schema = [
  `
  scalar Date

  type Group {
    id: Int!
    name: String
    users: [User]!
    messages: [Message]
  }

  type User {
    id: Int!
    email: String!
    username: String
    messages: [Message]
    groups: [Group]
    friends: [User]
  }

  type Message {
    id: Int!
    to: Group!
    from: User!
    text: String!
    createdAt: Date!
  }

  type Query {
    user(email: String, id: Int): User

    users: [User]

    messages(groupId: Int, userId: Int): [Message]

    group(id: Int!): Group
  }

  schema {
    query: Query
  }
`
];

export default Schema;
