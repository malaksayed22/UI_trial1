import { ApiError } from "./errors";

export type Settled<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

/**
 * Converts a rejected API call into a value, so a screen renders an explicit
 * state (missing, unavailable, denied) instead of a broken page.
 */
export const settle = async <T>(promise: Promise<T>): Promise<Settled<T>> => {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error };
    return {
      ok: false,
      error: new ApiError("unavailable", "The platform API returned an unexpected response."),
    };
  }
};
