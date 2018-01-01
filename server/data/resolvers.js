import GraphQLDate from "graphql-date";
import { User } from "./connectors";
import { pubsub } from "../subscriptions";
import { withFilter } from "graphql-subscriptions";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { messageLogic, groupLogic, userLogic, refute } from "./logic";

const MESSAGED_ADDED_TOPIC = "messageAdded";
const GROUP_ADDED_TOPIC = "groupAdded";

export const Resolvers = {
  Date: GraphQLDate,

  PageInfo: {
    hasNextPage: connection => connection.hasNextPage(),
    hasPreviousPage: connection => connection.hasPreviousPage()
  },

  Query: {
    group: groupLogic.query,

    messages: messageLogic.queryMessages,

    user: userLogic.query,

    users: userLogic.queryUsers,

    groups: groupLogic.queryGroups
  },

  Mutation: {
    createMessage: async (_, args, ctx) => {
      const message = await messageLogic.createMessage(args, ctx);

      pubsub.publish(MESSAGED_ADDED_TOPIC, {
        [MESSAGED_ADDED_TOPIC]: message
      });

      return message;
    },

    createGroup: async (_, args, ctx) => {
      const group = await groupLogic.createGroup(args, ctx);

      pubsub.publish(GROUP_ADDED_TOPIC, {
        [GROUP_ADDED_TOPIC]: group
      });

      return group;
    },

    deleteGroup: groupLogic.deleteGroup,

    leaveGroup: groupLogic.leaveGroup,

    updateGroup: groupLogic.updateGroup,

    login: async (_, { user: { email, password } }, ctx) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return Promise.reject("email not found");
      }

      if (!await bcrypt.compare(password, user.password)) {
        return Promise.reject("password incorrect");
      }

      user.jwt = jwt.sign(
        {
          id: user.id,
          email: user.email,
          version: 1
        },
        JWT_SECRET
      );
      ctx.user = Promise.resolve(user);
      return user;
    },

    signup: async (_, { user: { email, username, password } }, ctx) => {
      if (await User.findOne({ where: { email } })) {
        return Promise.reject("email already exists");
      }

      const user = await User.create({
        email,
        username: username || email,
        password: await bcrypt.hash(password, 10),
        version: 1
      });

      user.jwt = jwt.sign(
        {
          email,
          id: user.id,
          version: 1
        },
        JWT_SECRET
      );

      ctx.user = Promise.resolve(user);
      return user;
    }
  },

  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(MESSAGED_ADDED_TOPIC),
        async ({ messageAdded: { groupId, userId } }, { groupIds }, ctx) => {
          /*  { messageAdded: { groupId, userId } } is from
          MutationEvent.createMessage.pubsub above i.e from Message model

          { groupIds } is the argument to "messageAdded" subscription in the
          schema (schema.js)

          ctx is the user auth context attached to express req in index.js
          */

          try {
            const user = await ctx.user;

            const result = Boolean(
              groupIds && groupIds.includes(groupId) && refute(user.id, userId)
            );

            return result;
          } catch (_) {
            return false;
          }
        }
      )
    },

    groupAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(GROUP_ADDED_TOPIC),
        async ({ groupAdded: { userIds } }, _, ctx) => {
          try {
            const { id } = await ctx.user;
            const userId = id.toString();
            const result = Boolean(
              userId &&
                // ensure subscriber is among the users added to the group
                userIds.includes(userId) &&
                //do not subscribe if the subscriber is the creator (users[0])
                // of the group
                refute(userId, userIds[0])
            );

            return result;
          } catch (error) {
            return false;
          }
        }
      )
    }
  },

  Group: {
    users: groupLogic.users,

    messages: groupLogic.messages
  },

  Message: {
    to: messageLogic.to,

    from: messageLogic.from
  },

  User: {
    email: userLogic.email,

    friends: userLogic.friends,

    groups: userLogic.groups,

    jwt: userLogic.jwt,

    messages: userLogic.messages
  }
};

export default Resolvers;
