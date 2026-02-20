import { useQuery } from "@tanstack/react-query";
import { requestApi } from "../_services/api";

export type ApiStatusResponse = {
  ok: boolean;
};

export function getStatusApiStatus() {
  return requestApi<ApiStatusResponse>("/health", {
    method: "GET",
  });
}

export function useApiStatus() {
  return useQuery({
    queryKey: ["apiStatus"],
    queryFn: getStatusApiStatus,
  });
}
