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
    user: (_, args) => User.findOne({ where: args })
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
    from: message => message.getuser()
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
