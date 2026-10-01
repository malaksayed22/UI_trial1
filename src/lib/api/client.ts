import { resolveMock } from "@/mocks/handlers";
import type { DataSourceKind } from "@/types";
import { ApiError, errorFromStatus } from "./errors";

/**
 * Single transport for the platform API. With TRUSTOPS_API_URL set it calls
 * the live backend; otherwise it resolves requests from reviewed fixtures that
 * follow the same contract.
 */

const baseUrl = process.env.TRUSTOPS_API_URL?.replace(/\/$/, "");

export const dataSource: DataSourceKind = baseUrl ? "live" : "fixture";

export type Query = Record<string, string | number | undefined>;

const toStringQuery = (query: Query = {}) =>
  Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)])
  );

const request = async <T>(
  method: "GET" | "POST",
  path: string,
  query?: Query,
  body?: unknown
): Promise<T> => {
  const stringQuery = toStringQuery(query);

  if (!baseUrl) {
    return (await resolveMock({ method, path, query: stringQuery, body })) as T;
  }

  const url = new URL(`${baseUrl}/api/v1${path}`);
  Object.entries(stringQuery).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("unavailable", "The platform API could not be reached.");
  }

  if (!response.ok) {
    throw errorFromStatus(response.status, await readErrorMessage(response));
  }
  return (await response.json()) as T;
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
};

export const apiGet = <T>(path: string, query?: Query) =>
  request<T>("GET", path, query);

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>("POST", path, undefined, body);
