import { Ad4mClient } from "@perspect3vism/ad4m";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";

const PORT = parseInt(window.location.search.slice(6))

const apolloClient = new ApolloClient({
  link: new WebSocketLink({
    uri: `ws://localhost:${PORT}/graphql`,
    options: {
      reconnect: true,
    },
  }),
  cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "no-cache" },
    query: { fetchPolicy: "no-cache" },
  },
});

export default new Ad4mClient(apolloClient);
