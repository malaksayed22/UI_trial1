export type ApiErrorKind =
  | "not_found"
  | "not_applicable"
  | "forbidden"
  | "invalid"
  | "unavailable";

/** Stable error model so screens render a state instead of a stack trace. */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isApiError = (
  error: unknown,
  ...kinds: ApiErrorKind[]
): error is ApiError =>
  error instanceof ApiError && (kinds.length === 0 || kinds.includes(error.kind));

const kindForStatus = (status: number): ApiErrorKind => {
  if (status === 404) return "not_found";
  if (status === 403 || status === 401) return "forbidden";
  if (status === 409 || status === 422 || status === 400) return "invalid";
  return "unavailable";
};

export const errorFromStatus = (status: number, message: string) =>
  new ApiError(kindForStatus(status), message);
