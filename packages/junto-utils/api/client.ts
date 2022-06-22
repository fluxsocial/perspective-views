import { Ad4mClient } from "@perspect3vism/ad4m";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";

export function buildAd4mClient() {
  const port = parseInt(localStorage.getItem('ad4minPort'))
  const apolloClient = new ApolloClient({
    link: new WebSocketLink({
      uri: `ws://localhost:${port}/graphql`,
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

  // @ts-ignore
  return new Ad4mClient(apolloClient);    
}

const ad4mClient = buildAd4mClient();

export default ad4mClient;