import GraphQLDate from "graphql-date";
import { User, Message, Group } from "./connectors";

export const Resolvers = {
  Date: GraphQLDate,
  Query: {
    group: (_, args) => Group.find({ where: args }),
    messages: (_, args) =>
      Message.findAll({
        where: args,
        order: [["createdAt", "DESC"]]
      }),
    user: (_, args) => User.findOne({ where: args }),
    users: () => User.findAll(),
    groups: () => Group.findAll()
  },
  Mutation: {
    createMessage: (_, { text, userId, groupId }) =>
      Message.create({
        text,
        userId,
        groupId
      }),

    createGroup: (_, { name, userId }) =>
      Group.create({ name }).then(group => {
        return User.findOne({ where: { id: userId } }).then(user => {
          group.addUser(user);
          return group;
        });
      }),

    updateGroup: (_, { id, name }) =>
      Group.findOne({ where: { id } }).then(group =>
        group.update({ name }).then(updatedGrp => updatedGrp)
      )
  },
  Group: {
    users: group => group.getUsers(),
    messages: group =>
      Message.findAll({
        where: { groupId: group.id },
        order: [["createdAt", "DESC"]]
      })
  },
  Message: {
    to: message => message.getGroup(),
    from: message => message.getUser()
  },
  User: {
    messages: user =>
      Message.findAll({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]]
      }),
    groups: user => user.getGroups(),
    friends: user => user.getFriends()
  }
};

export default Resolvers;
