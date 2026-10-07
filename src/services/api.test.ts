import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

async function loadServices() {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  vi.resetModules();
  return import("./api");
}

function respondWith(data: unknown) {
  fetchMock.mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ data }),
  });
}

describe("admin API response normalization", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("normalizes backend member_count strings into chart values", async () => {
    const { adminService } = await loadServices();
    respondWith([
      { month: "2026-01", member_count: "2" },
      { month: "2026-02", member_count: "10" },
    ]);

    const response = await adminService.getMemberGrowthByMonth();

    expect(response).toMatchObject({
      success: true,
      data: [
        { month: "2026-01", members: 2 },
        { month: "2026-02", members: 10 },
      ],
    });
  });

  it("returns the explicit parser error for a non-numeric member_count", async () => {
    const { adminService } = await loadServices();
    respondWith([{ month: "2026-01", member_count: "not-a-number" }]);

    const response = await adminService.getMemberGrowthByMonth();

    expect(response).toMatchObject({
      success: false,
      error:
        "The monthly member-growth response did not include month and members/count values.",
    });
  });

  it("normalizes backend notification id and retains unread/read counts", async () => {
    const { notificationService } = await loadServices();
    respondWith({
      notifications: [
        {
          id: "notification-1",
          userId: "user-1",
          type: "account_update",
          message: "Account updated",
          isRead: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      unReadcount: 1,
      readcount: 2,
    });

    const response = await notificationService.getAll();

    expect(response).toMatchObject({
      success: true,
      data: {
        notifications: [{ id: "notification-1" }],
        unreadCount: 1,
        readCount: 2,
      },
    });
  });

  it("continues to accept legacy notification _id values", async () => {
    const { notificationService } = await loadServices();
    respondWith({
      notifications: [
        {
          _id: "legacy-notification-1",
          userId: "user-1",
          type: "account_update",
          message: "Account updated",
          isRead: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      unReadcount: 0,
      readcount: 1,
    });

    const response = await notificationService.getAll();

    expect(response).toMatchObject({
      success: true,
      data: { notifications: [{ id: "legacy-notification-1" }] },
    });
  });
});
