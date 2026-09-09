import { describe, expect, it, vi } from "vitest";

const { insertContactSubmission, notifyOwner } = vi.hoisted(() => ({
  insertContactSubmission: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => ({ insertContactSubmission }));
vi.mock("./_core/notification", () => ({ notifyOwner }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(remoteAddress = "127.0.0.1"): TrpcContext {
  return {
    user: null,
    req: {
      headers: {},
      socket: { remoteAddress },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  it("silently accepts honeypot submissions without persisting or notifying", async () => {
    const caller = appRouter.createCaller(createContext());

    const result = await caller.contact.submit({
      name: "bot",
      email: "bot@example.com",
      message: "This is a bot submission.",
      website: "https://spam.example",
    });

    expect(result).toEqual({ success: true, operatorNotified: true });
    expect(insertContactSubmission).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("persists a valid submission and reports notification success", async () => {
    insertContactSubmission.mockResolvedValueOnce(undefined);
    notifyOwner.mockResolvedValueOnce(true);
    const caller = appRouter.createCaller(createContext("10.0.0.10"));

    const result = await caller.contact.submit({
      name: "テスト利用者",
      email: "user@example.com",
      message: "サービスについて質問があります。",
      website: "",
    });

    expect(result).toEqual({ success: true, operatorNotified: true });
    expect(insertContactSubmission).toHaveBeenCalledWith({
      name: "テスト利用者",
      email: "user@example.com",
      message: "サービスについて質問があります。",
    });
    expect(notifyOwner).toHaveBeenCalledOnce();
  });

  it("keeps the submission accepted when persistence succeeds but owner notification is unavailable", async () => {
    insertContactSubmission.mockResolvedValueOnce(undefined);
    notifyOwner.mockResolvedValueOnce(false);
    const caller = appRouter.createCaller(createContext("10.0.0.11"));

    const result = await caller.contact.submit({
      name: "利用者",
      email: "user2@example.com",
      message: "通知が失敗した場合の案内を確認します。",
      website: "",
    });

    expect(result).toEqual({ success: true, operatorNotified: false });
  });

  it("rejects invalid email addresses before persistence", async () => {
    const caller = appRouter.createCaller(createContext("10.0.0.12"));

    await expect(
      caller.contact.submit({
        name: "",
        email: "invalid",
        message: "お問い合わせ内容です。",
        website: "",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
