import { Ad4mClient } from "@perspect3vism/ad4m";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";

export function buildAd4mClient(port = 12000) {
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
