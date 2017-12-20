import express from "express";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { makeExecutableSchema } from "graphql-tools";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Schema } from "./data/schema";
// import { Mocks } from "./data/mocks";
import { Resolvers } from "./data/resolvers";

const GRAPHQL_PORT = 8081;
const app = express();

const executableSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: Resolvers
});

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
    endpointURL: "/graphql"
  })
);

const graphqlServer = createServer(app);

graphqlServer.listen(GRAPHQL_PORT, () =>
  // eslint-disable-next-line no-console
  console.log(
    `GRAPHQL server is running on http://localhost:${GRAPHQL_PORT}/graphql`
  )
);
