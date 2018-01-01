import express from "express";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import bodyParser from "body-parser";
import { createServer } from "http";
import { getSubscriptionDetails } from "./subscriptions";
import { executableSchema } from "./data/schema";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import jwt from "express-jwt";
import { JWT_SECRET } from "./config";
import { User } from "./data/connectors";
import jsonwebtoken from "jsonwebtoken";
import { subscriptionLogic } from "./data/logic";

const GRAPHQL_PORT = 8082;
const GRAPHQL_PATH = "/graphql";
const SUBSCRIPTIONS_PATH = "/subscriptions";
// const GRAPHQL_HOST = "192.168.178.42"; //from ifconfig on ubuntu
const GRAPHQL_HOST = "0.0.0.0";

const app = express();

app.use(
  "/graphql",
  bodyParser.json(),
  jwt({
    secret: JWT_SECRET,
    credentialsRequired: false
  }),
  graphqlExpress(req => ({
    schema: executableSchema,
    context: {
      user: req.user
        ? User.findOne({
            where: {
              id: req.user.id,
              version: req.user.version
            }
          })
        : Promise.resolve(null)
    }
  }))
);

app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: GRAPHQL_PATH,
    subscriptionsEndpoint: `ws://${GRAPHQL_HOST}:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`
  })
);

const graphqlServer = createServer(app);

graphqlServer.listen(GRAPHQL_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `GRAPHQL server is now running on http://${GRAPHQL_HOST}:${GRAPHQL_PORT}${GRAPHQL_PATH}`
  );
  // eslint-disable-next-line no-console
  console.log(
    `GRAPHQL subscriptions are now running on ws://${GRAPHQL_HOST}:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`
  );
});

SubscriptionServer.create(
  {
    schema: executableSchema,
    execute,
    subscribe,
    onConnect(connectionParams) {
      const userPromise = new Promise((res, rej) => {
        if (connectionParams.jwt) {
          jsonwebtoken.verify(
            connectionParams.jwt,
            JWT_SECRET,
            (err, decoded) => {
              if (err) {
                rej("Invalid Token");
              }

              res(
                User.findOne({
                  where: { id: decoded.id, version: decoded.version }
                })
              );
            }
          );
        } else {
          // rej("No Token");
          res(
            User.findOne({
              where: { email: "Syble_Bauch55@hotmail.com" }
            })
          );
        }
      });

      return userPromise.then(user => {
        if (user) {
          return { user: Promise.resolve(user) };
        }

        return Promise.reject("No User");
      });
    },
    onOperation(parsedMessage, baseParams) {
      // we need to implement this!!!
      const { subscriptionName, args } = getSubscriptionDetails({
        baseParams,
        schema: executableSchema
      });

      // we need to implement this too!!!
      return subscriptionLogic[subscriptionName](
        baseParams,
        args,
        baseParams.context
      );
    }
  },
  {
    server: graphqlServer,
    path: SUBSCRIPTIONS_PATH
  }
);
