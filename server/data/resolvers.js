import GraphQLDate from "graphql-date";
import { User, Message, Group } from "./connectors";

export const Resolvers = {
  Date: GraphQLDate,
  PageInfo: {
    hasNextPage: connection => connection.hasNextPage(),
    hasPreviousPage: connection => connection.hasPreviousPage()
  },
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
    messages: async (group, { first, last, before, after }) => {
      const where = { groupId: group.id };

      if (before) {
        where.id = { $gt: Buffer.from(before, "base64").toString() };
      }

      if (after) {
        where.id = { $lt: Buffer.from(after, "base64").toString() };
      }

      const messages = await Message.findAll({
        where,
        order: [["id", "DESC"]],
        limit: first || last
      });

      const edges = messages.map(message => ({
        cursor: Buffer.from(message.id.toString()).toString("base64"),
        node: message
      }));

      const hasNextPage = async () =>
        messages.length < (last || first)
          ? false
          : !!await Message.findOne({
              where: {
                groupId: group.id,
                id: {
                  [before ? "$gt" : "$lt"]: messages[messages.length - 1].id
                }
              },
              order: [["id", "DESC"]]
            });

      const hasPreviousPage = async () =>
        !!await Message.findOne({
          where: {
            groupId: group.id,
            id: where.id
          },
          order: [["id"]]
        });

      return {
        edges,
        pageInfo: {
          hasPreviousPage,
          hasNextPage
        }
      };
    }
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
