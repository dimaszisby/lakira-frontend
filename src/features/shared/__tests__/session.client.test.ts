import { persistSessionToken } from "@/features/shared/session.client";

const mockFetch = jest.fn<Promise<Pick<Response, "ok">>, Parameters<typeof fetch>>();

describe("persistSessionToken", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("posts the token and resolves true when the server stores it", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await expect(persistSessionToken("a.b.c")).resolves.toBe(true);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "a.b.c" }),
    });
  });

  it("resolves false when the server rejects the token", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    await expect(persistSessionToken("a.b.c")).resolves.toBe(false);
  });

  it("resolves false when the request cannot be made", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(persistSessionToken("a.b.c")).resolves.toBe(false);

    warn.mockRestore();
  });

  it("clears the session with a DELETE when given no token", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await expect(persistSessionToken(null)).resolves.toBe(true);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/session", { method: "DELETE" });
  });
});
