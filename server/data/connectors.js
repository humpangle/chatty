import Sequelize from "sequelize";
import faker from "faker";
import { times, flatten } from "lodash";
import bcrypt from "bcrypt";

const db = new Sequelize("chatty", null, null, {
  dialect: "sqlite",
  storage: "./chatty.sqlite",
  logging: false
});

const GroupModel = db.define("group", {
  name: { type: Sequelize.STRING }
});

const MessageModel = db.define("message", {
  text: { type: Sequelize.STRING }
});

const UserModel = db.define("user", {
  email: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
  version: { type: Sequelize.INTEGER }
});

// User.getGroups() = Array<Group>
UserModel.belongsToMany(GroupModel, { through: "GroupUser" });

// User.getFriends() = Array<User>
UserModel.belongsToMany(UserModel, { through: "Friends", as: "friends" });

// Message.getUser() = User
MessageModel.belongsTo(UserModel);

// User.getLastRead() = Array<Messages> : messages last read by a user
UserModel.belongsToMany(MessageModel, {
  through: "MessageUser",
  as: "lastRead"
});

// Message.getLastRead() = Array<User> : users that last read a message
MessageModel.belongsToMany(UserModel, {
  through: "MessageUser",
  as: "lastRead"
});

// Message.getGroup() = Group
MessageModel.belongsTo(GroupModel);

// Group.getUsers = Array<User>
GroupModel.belongsToMany(UserModel, { through: "GroupUser" });

const Group = db.models.group;
const Message = db.models.message;
const User = db.models.user;

const GROUPS = 4;
const USERS_PER_GROUP = 5;
const MESSAGES_PER_USER = 5;

const makeUser = async (group, message) => {
  const password = faker.internet.password().toLowerCase();
  const userValues = {
    email: faker.internet.email().toLowerCase(),
    username: faker.internet.userName().toLowerCase(),
    password: await bcrypt.hash(password, 10),
    version: 1
  };

  let user;

  if (group) {
    user = await group.createUser(userValues);
  } else {
    user = await User.create(userValues);
  }

  // eslint-disable-next-line no-console
  console.log(
    "{email, password, username}",
    `{${user.email}, ${password}, ${user.username}}`
  );

  if (message) {
    times(MESSAGES_PER_USER, () =>
      MessageModel.create({
        userId: user.id,
        groupId: group.id,
        text: faker.lorem.words(3)
      })
    );
  }

  return user;
};

(async function syncDb() {
  await db.sync({ force: true });

  faker.seed(123);

  const groups = times(GROUPS, async () => {
    const group = await GroupModel.create({
      name: faker.lorem.words(3)
    });

    const usersForGroup = times(USERS_PER_GROUP, () => makeUser(group, true));
    return { group, users: await Promise.all(usersForGroup) };
  });

  const groupWithUsers = await Promise.all(groups);

  const users = flatten(groupWithUsers.map(g => g.users));

  // We make users with deterministic IDs for testing
  // A user with a deterministic ID (21), belongs to grp 1 and has messages
  const beforeLastUser = await makeUser(groupWithUsers[0].group, true);

  // A user with deterministic ID (22), has no group and messages
  const lastUser = await makeUser();

  beforeLastUser.addFriend(lastUser);
  lastUser.addFriend(beforeLastUser);

  users.forEach((current, i) => {
    lastUser.addFriend(current);
    beforeLastUser.addFriend(current);
    current.addFriend(lastUser);
    current.addFriend(beforeLastUser);

    users.forEach((user, j) => {
      if (i !== j) {
        current.addFriend(user);
      }
    });
  });
})();

export { Group, Message, User };
