export const parseJsonSafely = async <T>(
  response: Response,
): Promise<T | null> => {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const hasHeadersGet = typeof response.headers?.get === "function";
  if (hasHeadersGet) {
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return null;
    }
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
};
