export const createJsonResponse = <T>(
  data: T,
  init: ResponseInit = {},
): Response => {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    ...init,
    headers,
  });
};

export const createEmptyResponse = (
  init: ResponseInit = { status: 204 },
): Response => {
  const headers = new Headers(init.headers);
  return new Response(null, {
    ...init,
    headers,
  });
};
