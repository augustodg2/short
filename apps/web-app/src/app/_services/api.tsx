export type JSONValue =
  | string
  | number
  | boolean
  | JSONValue[]
  | {
      [k: string]: JSONValue;
    };

export async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(`/api${url}`, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
    },
  });

  let responseBody: JSONValue | null = null;

  try {
    responseBody = await response.json();
  } catch {
    console.warn("Failed to parse response JSON.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, responseBody);
  }

  return responseBody as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: JSONValue | null,
  ) {
    super(`ApiError: Response status ${status}.`);
  }
}
