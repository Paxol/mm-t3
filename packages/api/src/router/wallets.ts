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

  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.number(),
        initialValue: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.wallet.create({
        data: {
          ...input,
          currentValue: input.initialValue,
          deleted: false,
          userid: ctx.session.user.id,
        },
      });
    }),
});
