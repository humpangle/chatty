import express from "express";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import bodyParser from "body-parser";
import { createServer } from "http";
import { executableSchema } from "./data/schema";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";

const GRAPHQL_PORT = 8082;
const GRAPHQL_PATH = "/graphql";
const SUBSCRIPTIONS_PATH = "/subscriptions";
// const GRAPHQL_HOST = "192.168.178.42"; //from ifconfig on ubuntu
const GRAPHQL_HOST = "0.0.0.0";

const app = express();

app.use(
  "/graphql",
  bodyParser.json(),
  graphqlExpress({
    schema: executableSchema,
    context: {}
  })
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
    subscribe
  },
  {
    server: graphqlServer,
    path: SUBSCRIPTIONS_PATH
  }
);
