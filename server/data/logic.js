// @ts-check

import { Message, Group, User } from "./connectors";

const getAuthenticatedUser = async ctx => {
  const user = await ctx.user;
  return user ? user : Promise.reject("Unauthorized");
};

export const messageLogic = {
  from: message => message.getUser({ attributes: ["id", "username"] }),

  to: message => message.getGroup({ attributes: ["id", "name"] }),

  createMessage: async ({ message: { text, groupId } }, ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const group = await user.getGroups({
      where: { id: groupId },
      attributes: ["id"]
    });

    return !group.length
      ? Promise.reject("Unauthorized")
      : await Message.create({
          groupId,
          text,
          userId: user.id
        });
  },

  queryMessages: (_, args) =>
    Message.findAll({
      where: args,
      order: [["createdAt", "DESC"]]
    })
};

export const groupLogic = {
  users: group => group.getUsers({ attributes: ["id", "username"] }),

  messages: async ({ id: groupId }, { messageConnection = {} }) => {
    const { first, last, before, after } = messageConnection;
    const where = { groupId };

    /* Because we return messages from newest to oldest
      before means newer in our case (the usual meaninging is older)
    */
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
              groupId,
              id: {
                [before ? "$gt" : "$lt"]: messages[messages.length - 1].id
              }
            },
            order: [["id", "DESC"]]
          });

    const hasPreviousPage = async () =>
      !!await Message.findOne({
        where: {
          groupId,
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
  },

  query: async (_, { id }, ctx) => {
    const user = await getAuthenticatedUser(ctx);

    return await Group.findOne({
      where: { id },

      include: [
        {
          model: User,
          where: {
            id: user.id
          }
        }
      ]
    });
  },

  createGroup: async ({ group: { name, userIds: friends } }, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const userIds = [`${user.id}`, ...friends];
    const group = await Group.create({ name });

    await group.addUser(userIds);

    group.userIds = userIds;

    return group;
  },

  deleteGroup: async (_, { id }, ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const group = await Group.findOne({
      where: { id },
      include: [
        {
          model: User,
          where: {
            id: user.id
          }
        }
      ]
    });

    await group.removeUsers(await group.getUsers());
    await Message.destroy({
      where: {
        groupId: group.id
      }
    });

    return await group.destroy();
  },

  leaveGroup: async (_, { id }, ctx) => {
    const { id: userId } = await getAuthenticatedUser(ctx);

    const group = await Group.findOne({
      where: {
        id
      },
      include: [
        {
          model: User,
          where: {
            id: userId
          }
        }
      ]
    });

    if (!group) {
      return Promise.reject(
        `No group with id "${id}" found for user "${userId}"`
      );
    }

    await group.removeUser(userId);

    // Delete the group if there are no other users of the group
    if (!(await group.getUsers()).length) {
      await group.destroy();
    }

    return { id: `${id}` };
  },

  updateGroup: async (_, { group: { id, name, lastRead } }, ctx) => {
    const user = await getAuthenticatedUser(ctx);

    let group = await Group.findOne({
      where: {
        id
      },
      include: [
        {
          model: User,
          where: {
            id: user.id
          }
        }
      ]
    });

    if (!group) {
      return Promise.reject(
        `No group with id "${id}" found for user ${user.id}`
      );
    }

    let options = {};

    if (lastRead) {
      const oldLastRead = await user.getLastRead({
        where: {
          groupId: id
        }
      });
      await user.removeLastRead(oldLastRead);
      options = await user.addLastRead(lastRead);
    }

    if (name) {
      options = { ...options, name };
    }

    return await group.update(options);
  },

  queryGroups: () => Group.findAll(),

  lastRead: async ({ id: groupId }, _, ctx) => {
    try {
      const user = await getAuthenticatedUser(ctx);
      const lastRead = await user.getLastRead({
        where: {
          groupId
        }
      });

      return lastRead.length ? lastRead[0] : null;
    } catch (error) {
      return null;
    }
  },

  unreadCount: async ({ id: groupId }, _, ctx) => {
    try {
      const user = await getAuthenticatedUser(ctx);
      const lastRead = await user.getLastRead({
        where: {
          groupId
        }
      });

      if (!lastRead.length) {
        return await Message.count({
          where: {
            groupId
          }
        });
      }

      return await Message.count({
        where: {
          groupId,
          createdAt: { $gt: lastRead[0].createdAt }
        }
      });
    } catch (error) {
      return Promise.reject("Error while getting group unread messages count.");
    }
  }
};

export const userLogic = {
  email: async ({ id }, _, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return assert(user.id, id) ? user.email : Promise.reject("Unauthorized");
  },

  friends: async ({ id }, _, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return assert(user.id, id)
      ? user.getFriends({ attributes: ["id", "username"] })
      : Promise.reject("Unauthorized");
  },

  groups: async ({ id }, _, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return assert(user.id, id)
      ? user.getGroups()
      : Promise.reject("Unauthorized");
  },

  jwt: user => Promise.resolve(user.jwt),

  messages: async ({ id }, _, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return assert(user.id, id)
      ? Message.findAll({
          where: {
            userId: user.id
          },
          order: [["createdAt", "DESC"]]
        })
      : Promise.reject("Unauthorized");
  },

  query: async (_, { id, email }, ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return assert(user.id, id) || user.email === email
      ? user
      : Promise.reject("Unauthorized");
  },

  queryUsers: () => User.findAll()
};

export const subscriptionLogic = {
  groupAdded: async (baseParams, _, ctx) => {
    await getAuthenticatedUser(ctx);
    baseParams.context = ctx;
    return baseParams;
  },

  messageAdded: async (baseParams, { groupIds }, ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const groups = await user.getGroups({
      where: {
        id: {
          $in: groupIds
        }
      },
      attributes: ["id"]
    });

    // user attempted to subscribe to some group to which she does not belong
    if (groupIds.length > groups.length) {
      return Promise.reject("Unauthorized");
    }

    baseParams.context = ctx;
    return baseParams;
  }
};

function assert(id1, id2) {
  return `${id1}` === `${id2}`;
}

export function refute(id1, id2) {
  return `${id1}` !== `${id2}`;
}
