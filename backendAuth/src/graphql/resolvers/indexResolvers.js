import { dateScalar, dateTime } from "./../scalarTypeDate.js";
import GraphQLJSON from "graphql-type-json";
import { userMutations } from "./user/mutations.js";
import { userQuery } from "./user/queries.js";

const resolvers = {
  miTimestamp: dateScalar,
  dateTime: dateTime,
  JSON: GraphQLJSON,
  Query: {
    ...userQuery,
  },
  Mutation: {
    ...userMutations,
  },
};
export { resolvers };
