// Initial, adjustable engineering value (not a measured SLO). It bounds this
// application's wait only: Next.js may drop the caller signal during
// stale/background revalidation, and its cache writes may finish later.
export const EXTERNAL_REQUEST_TIMEOUT_MS = 5000;

export function requireConfig(
  value: string | undefined,
  label: string
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${label} configuration is missing`);
  }
  return trimmed;
}

export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  serviceLabel: string
): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const request = (async () => {
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch {
      throw new Error(`${serviceLabel} request failed`);
    }

    if (!response.ok) {
      throw new Error(`${serviceLabel} responded with ${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      throw new Error(`${serviceLabel} returned invalid data`);
    }
  })();

  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`${serviceLabel} request timed out`));
    }, EXTERNAL_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([request, deadline]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
