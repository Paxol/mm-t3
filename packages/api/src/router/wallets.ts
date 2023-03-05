import { z } from "zod";
import { Wallet } from "@paxol/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const walletsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          includeDeleted: z.boolean(),
        })
        .optional()
        .default({ includeDeleted: false }),
    )
    .query(async ({ input, ctx }): Promise<Wallet[]> => {
      return await ctx.prisma.wallet.findMany({
        where: {
          userid: ctx.session.user.id,
          deleted: input.includeDeleted,
        },
        orderBy: {
          name: "asc",
        },
      });
    }),
});
