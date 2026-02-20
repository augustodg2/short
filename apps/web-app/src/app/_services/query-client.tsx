import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if ([400, 401, 403, 404].includes((error as ApiError).status)) {
          return false;
        }

        return failureCount < 3;
      },
    },
  },
});
