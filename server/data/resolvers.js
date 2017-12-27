import GraphQLDate from "graphql-date";
import { User, Message, Group } from "./connectors";
import { pubsub } from "../subscriptions";
import { withFilter } from "graphql-subscriptions";

const MESSAGED_ADDED_TOPIC = "messageAdded";
const GROUP_ADDED_TOPIC = "groupAdded";

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
    createMessage: async (_, { text, userId, groupId }) => {
      const message = await Message.create({
        text,
        userId,
        groupId
      });

      pubsub.publish(MESSAGED_ADDED_TOPIC, {
        [MESSAGED_ADDED_TOPIC]: message
      });

      return message;
    },

    createGroup: async (_, { name, userId, userIds: friends }) => {
      const userIds = [userId, ...friends];
      const group = await Group.create({ name });

      await group.addUser(userIds);

      group.users = userIds;

      pubsub.publish(GROUP_ADDED_TOPIC, {
        [GROUP_ADDED_TOPIC]: group
      });

      return group;
    },

    updateGroup: (_, { id, name }) =>
      Group.findOne({ where: { id } }).then(group =>
        group.update({ name }).then(updatedGrp => updatedGrp)
      ),

    createUser: (_, { email, username }) =>
      User.create({
        email,
        username
      })
  },
  Subscription: {
    [MESSAGED_ADDED_TOPIC]: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(MESSAGED_ADDED_TOPIC),
        (
          { messageAdded: { groupId, userId: userId_ } },
          { groupIds, userId }
        ) =>
          Boolean(groupIds && groupIds.includes(groupId) && userId !== userId_)
      )
    },

    [GROUP_ADDED_TOPIC]: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(GROUP_ADDED_TOPIC),
        ({ groupAdded: { users } }, { userId }) =>
          Boolean(userId && users.includes(userId) && userId !== users[0])
      )
    }
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
