import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(async ({ ctx }) => {
    try {
      await ctx.prisma.$connect();
      await ctx.prisma.$disconnect();
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return "ok"
  }),
});
