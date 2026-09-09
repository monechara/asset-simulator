import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { insertContactSubmission } from "./db";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

const recentSubmissions = new Map<string, number[]>();

function getClientKey(req: {
  headers: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(forwardedValue ?? req.socket?.remoteAddress ?? "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const recent = (recentSubmissions.get(key) ?? []).filter(
    timestamp => timestamp > windowStart
  );
  if (recent.length >= 5) {
    recentSubmissions.set(key, recent);
    return true;
  }
  recent.push(now);
  recentSubmissions.set(key, recent);
  return false;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().trim().max(120).optional().default(""),
          email: z.string().trim().email().max(320),
          message: z.string().trim().min(10).max(5000),
          website: z.string().max(100).optional().default(""),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Hidden honeypot: bots receive a neutral success response without persistence.
        if (input.website.trim())
          return { success: true, operatorNotified: true } as const;
        if (isRateLimited(getClientKey(ctx.req))) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "送信回数が多いため、しばらくしてからお試しください。",
          });
        }

        await insertContactSubmission({
          name: input.name.trim() || null,
          email: input.email.trim(),
          message: input.message.trim(),
        });

        const operatorNotified = await notifyOwner({
          title: "新しいお問い合わせが届きました",
          content: [
            `名前: ${input.name.trim() || "未入力"}`,
            `メールアドレス: ${input.email.trim()}`,
            "",
            input.message.trim(),
          ].join("\\n"),
        });

        return { success: true, operatorNotified } as const;
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
