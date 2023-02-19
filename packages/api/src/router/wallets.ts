import { Wallet } from "@paxol/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const walletsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }): Promise<Wallet[]> => {
    return await ctx.prisma.wallet.findMany({
      where: {
        userid: ctx.session.user.id,
        deleted: false,
      },
      orderBy: {
        name: "desc"
      }
    });
  }),
});
