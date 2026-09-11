import { describe, expect, it, vi } from "vitest";
import {
  FORMSPREE_ENDPOINT,
  submitContactToFormspree,
} from "./formspreeContact";

describe("submitContactToFormspree", () => {
  it("sends the three contact fields to the configured Formspree endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await submitContactToFormspree(
      {
        name: "山田太郎",
        email: "taro@example.com",
        message: "お問い合わせ内容です。",
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(FORMSPREE_ENDPOINT);
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Accept: "application/json" });

    const body = options?.body as FormData;
    expect(body.get("name")).toBe("山田太郎");
    expect(body.get("email")).toBe("taro@example.com");
    expect(body.get("message")).toBe("お問い合わせ内容です。");
  });

  it("throws when Formspree rejects the submission", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid" }), { status: 422 }),
    );

    await expect(
      submitContactToFormspree(
        { name: "", email: "bad@example.com", message: "短い" },
        fetchMock,
      ),
    ).rejects.toThrow("invalid");
  });
});
