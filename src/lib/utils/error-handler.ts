import type { PostgrestError } from "@supabase/supabase-js";

interface ErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  console.error("[API Error]", error);

  if (error instanceof ApiError) {
    return buildResponse(error.statusCode, {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (isPostgrestError(error)) {
    return handleDatabaseError(error);
  }

  return buildResponse(500, {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

function handleDatabaseError(error: PostgrestError): Response {
  if (error.code === "23505") {
    return buildResponse(409, {
      error: {
        code: "CONFLICT",
        message: "Resource already exists",
        details: error.details,
      },
    });
  }

  if (error.code === "23503") {
    return buildResponse(404, {
      error: {
        code: "NOT_FOUND",
        message: "Referenced resource not found",
        details: error.details,
      },
    });
  }

  return buildResponse(500, {
    error: {
      code: "DATABASE_ERROR",
      message: error.message,
      details: error.details,
    },
  });
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return Boolean(error) && typeof error === "object" && "code" in (error as Record<string, unknown>);
}

function buildResponse(status: number, payload: ErrorPayload): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
