import { act, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

import { withAuth } from "@/components/hoc/withAuth";
import { fetchUserProfile } from "@/src/services/api/auth.api";
import type { UserAtom } from "@/src/services/state/atoms";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

jest.mock("@/src/services/api/auth.api", () => ({ fetchUserProfile: jest.fn() }));

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockFetchUserProfile = fetchUserProfile as jest.MockedFunction<typeof fetchUserProfile>;

const Protected = withAuth(() => <p>account content</p>);

const profile: UserAtom = {
  id: "user-1",
  username: "john",
  email: "john@example.com",
  role: "user",
  isPublicProfile: true,
};

/**
 * A promise the test resolves by hand.
 *
 * ## What these tests do and do not cover
 *
 * They cover `withAuth`'s contract, which had no tests at all: it renders the
 * page on a resolved profile, redirects on an empty or failed one, and uses the
 * cache without a request.
 *
 * They do **not** reproduce the bug that prompted the fix, and that was
 * established rather than assumed. The deadlock needs the profile fetch to be
 * in flight when StrictMode's cleanup runs. Instrumenting the original showed
 * jsdom always orders it the other way — `effect → finally → cleanup → effect`
 * — even with a promise held open across the remount, because cleanup is
 * scheduled after the microtask queue drains. A browser runs cleanup in the
 * same commit, which is why `/account` hung in `next dev` and not here.
 *
 * So these pass against the broken component too. The fix is verified in the
 * browser; do not read a green run here as proof the race is gone.
 */
const makeDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** Both StrictMode passes have run, so the first pass's cleanup has fired. */
const afterStrictModeRemount = async () => {
  await waitFor(() => expect(mockFetchUserProfile).toHaveBeenCalled());
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("withAuth under StrictMode", () => {
  it("renders the page when the profile arrives after the remount", async () => {
    const deferredProfile = makeDeferred<UserAtom | null>();
    mockFetchUserProfile.mockReturnValue(deferredProfile.promise);

    renderWithProviders(
      <StrictMode>
        <Protected />
      </StrictMode>,
    );

    await afterStrictModeRemount();
    await act(async () => {
      deferredProfile.resolve(profile);
    });

    // The failure mode was the spinner never clearing, so this is the assertion
    // that matters: `checking` has to reach false for children to render.
    expect(await screen.findByText("account content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when the profile resolves empty after the remount", async () => {
    const deferredProfile = makeDeferred<UserAtom | null>();
    mockFetchUserProfile.mockReturnValue(deferredProfile.promise);

    renderWithProviders(
      <StrictMode>
        <Protected />
      </StrictMode>,
    );

    await afterStrictModeRemount();
    await act(async () => {
      deferredProfile.resolve(null);
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("account content")).not.toBeInTheDocument();
  });

  it("redirects to login when the profile fetch rejects after the remount", async () => {
    const deferredProfile = makeDeferred<UserAtom | null>();
    mockFetchUserProfile.mockReturnValue(deferredProfile.promise);

    renderWithProviders(
      <StrictMode>
        <Protected />
      </StrictMode>,
    );

    await afterStrictModeRemount();
    await act(async () => {
      deferredProfile.reject(new Error("boom"));
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });

  it("uses the cached profile without a request", async () => {
    renderWithProviders(
      <StrictMode>
        <Protected />
      </StrictMode>,
      { initialQueryData: [{ queryKey: ["userProfile"], data: profile }] },
    );

    expect(await screen.findByText("account content")).toBeInTheDocument();
    expect(mockFetchUserProfile).not.toHaveBeenCalled();
  });
});
