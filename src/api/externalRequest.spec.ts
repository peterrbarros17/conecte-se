import {
  EXTERNAL_REQUEST_TIMEOUT_MS,
  fetchJsonWithTimeout,
  requireConfig,
} from "@/api/externalRequest";

const TEST_URL = "https://example.test/data?key=SUPER_SECRET_KEY";

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function expectSafeRejection(promise: Promise<unknown>, secrets: string[]) {
  let rejected = false;
  try {
    await promise;
  } catch (error) {
    rejected = true;
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      for (const secret of secrets) {
        expect(error.message).not.toContain(secret);
      }
    }
  }
  expect(rejected).toBe(true);
}

describe("requireConfig", () => {
  it("returns the trimmed value when configured", () => {
    expect(requireConfig("  key-123  ", "LATEST_VIDEO")).toBe("key-123");
  });

  it.each([undefined, "", "   \t\n "])(
    "throws a safe error naming the setting for %p",
    (value) => {
      expect(() => requireConfig(value, "GIST")).toThrow("GIST");
      try {
        requireConfig(value, "GIST");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).not.toContain("key-123");
        }
      }
    }
  );
});

describe("fetchJsonWithTimeout", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("returns parsed JSON with the request options and clears the timer on success", async () => {
    const payload = { message: "PAYLOAD_MARKER" };
    fetchMock.mockResolvedValue(jsonResponse(payload));
    const init = { next: { revalidate: 300 } };

    await expect(
      fetchJsonWithTimeout(TEST_URL, init, "Example API")
    ).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.next).toEqual({ revalidate: 300 });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("throws a safe status error and clears the timer for a non-OK response", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 503));

    await expectSafeRejection(
      fetchJsonWithTimeout(TEST_URL, {}, "Example API"),
      [TEST_URL, "SUPER_SECRET_KEY"]
    );
    await expect(
      fetchJsonWithTimeout(TEST_URL, {}, "Example API")
    ).rejects.toThrow("Example API responded with 503");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("throws a safe failure error without echoing a network error", async () => {
    fetchMock.mockRejectedValue(
      new Error(`connect failed at ${TEST_URL} with SUPER_SECRET_KEY`)
    );

    await expectSafeRejection(
      fetchJsonWithTimeout(TEST_URL, {}, "Example API"),
      [TEST_URL, "SUPER_SECRET_KEY"]
    );
    await expect(
      fetchJsonWithTimeout(TEST_URL, {}, "Example API")
    ).rejects.toThrow("Example API request failed");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("throws a safe error when the body cannot be parsed", async () => {
    const response = jsonResponse(null);
    response.json.mockRejectedValue(new Error("PAYLOAD_MARKER is not JSON"));
    fetchMock.mockResolvedValue(response);

    await expect(
      fetchJsonWithTimeout(TEST_URL, {}, "Example API")
    ).rejects.toThrow("Example API returned invalid data");
    expect(jest.getTimerCount()).toBe(0);
  });

  describe("deadline behavior", () => {
    it("aborts at the deadline, throws a safe timeout error, and clears the timer", async () => {
      const pending = deferred<unknown>();
      const capturedSignals: Array<AbortSignal | null> = [];
      fetchMock.mockImplementation((_url: string, options: RequestInit) => {
        capturedSignals.push(options.signal ?? null);
        return pending.promise;
      });

      const result = fetchJsonWithTimeout(TEST_URL, {}, "Example API");
      await Promise.resolve();

      const [signal] = capturedSignals;
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);

      jest.advanceTimersByTime(EXTERNAL_REQUEST_TIMEOUT_MS);

      await expectSafeRejection(result, [TEST_URL, "SUPER_SECRET_KEY"]);
      await expect(result).rejects.toThrow("Example API request timed out");
      expect(signal?.aborted).toBe(true);
      expect(jest.getTimerCount()).toBe(0);

      pending.resolve({ late: "PAYLOAD_MARKER" });
      await Promise.resolve();
    });

    it("ignores a late success after the deadline", async () => {
      const pending = deferred<unknown>();
      fetchMock.mockReturnValue(pending.promise);

      const result = fetchJsonWithTimeout(TEST_URL, {}, "Example API");
      jest.advanceTimersByTime(EXTERNAL_REQUEST_TIMEOUT_MS);
      await expect(result).rejects.toThrow("Example API request timed out");

      pending.resolve({ late: "PAYLOAD_MARKER" });
      await Promise.resolve();
      await Promise.resolve();

      await expect(result).rejects.toThrow("Example API request timed out");
      expect(jest.getTimerCount()).toBe(0);
    });

    it("ignores a late rejection without producing an unhandled rejection", async () => {
      const pending = deferred<unknown>();
      fetchMock.mockReturnValue(pending.promise);

      const result = fetchJsonWithTimeout(TEST_URL, {}, "Example API");
      jest.advanceTimersByTime(EXTERNAL_REQUEST_TIMEOUT_MS);
      await expect(result).rejects.toThrow("Example API request timed out");

      pending.reject(new Error("late SUPER_SECRET_KEY failure"));
      // Only let the internal chains settle; an actually unhandled rejection
      // would fail the suite through Jest's native reporting.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      await expect(result).rejects.toThrow("Example API request timed out");
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
