import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionWithJoins } from "../types";

export const transactionsRouter = createTRPCRouter({
  getRange: protectedProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }): Promise<TransactionWithJoins[]> => {
      return await ctx.prisma.transaction.findMany({
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          type: true,
          future: true,
          categoryId: true,
          walletId: true,
          walletFromId: true,
          walletToId: true,
          userid: true,

          category: true,
          wallet: true,
          walletFrom: true,
          walletTo: true,
        },
        where: {
          AND: [
            {
              userid: ctx.session.user.id,
            },
            {
              date: {
                gte: new Date(input.from),
                lte: new Date(input.to),
              },
            },
          ],
        },
        orderBy: {
          date: "desc",
        },
      });
    }),
});
