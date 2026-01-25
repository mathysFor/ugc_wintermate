import { QueryClient, QueryCache } from "@tanstack/react-query";

export const queryCache = new QueryCache({})
export const queryClient = new QueryClient({
    queryCache,
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - Les données restent "fraîches" pendant 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes - Les données restent en cache 30 minutes même après qu'elles ne soient plus utilisées
        },
    },
})
