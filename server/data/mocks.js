import faker from "faker";

export const Mocks = {
  Date: () => new Date(),
  Int: () => parseInt(Math.random() * 100, 10),
  String: () => faker.lorem.words(Math.random() * 3),
  Query: () => ({
    user: (root, { email }) => ({
      email,
      messages: [
        {
          from: { email }
        }
      ]
    }),
    User: () => ({
      email: faker.internet.email(),
      username: faker.internet.userName()
    }),
    Group: () => ({
      name: faker.lorem.words(Math.random() * 3)
    }),
    Message: () => ({
      text: faker.lorem.words(Math.random() * 3)
    })
  })
};

export default Mocks;
