import { Ad4mClient } from "@perspect3vism/ad4m";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";

const PORT = 12000;

const apolloClient = new ApolloClient({
  link: new WebSocketLink({
    uri: `ws://localhost:${PORT}/graphql`,
    options: {
      reconnect: true,
      connectionParams: async () => {
        return {
          headers: {
            authorization: localStorage.getItem("ad4minToken") || "",
          },
        };
      },
    },
  }),
  cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "no-cache" },
    query: { fetchPolicy: "no-cache" },
  },
});

export default new Ad4mClient(apolloClient);
