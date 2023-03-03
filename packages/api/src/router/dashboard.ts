import moment from "moment/moment";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionWithJoins } from "../types";

export const dashboardRouter = createTRPCRouter({
  transactions: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.prisma.user.findFirstOrThrow({
      select: {
        Transactions: {
          select: {
            id: true,
            amount: true,
            date: true,
            description: true,
            future: true,
            type: true,

            category: true,
          },
          where: {
            date: {
              gte: moment().subtract(1, "months").toDate(),
              lte: moment().toDate(),
            },
          },
        },
      },
      where: {
        id: ctx.session.user.id,
      },
    });

    return data.Transactions;
  }),

  latestTransactions: protectedProcedure.query(
    async ({ ctx }): Promise<TransactionWithJoins[]> =>
      await ctx.prisma.transaction.findMany({
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          type: true,
          future: true,
          categoryId: true,
          walletId: true,
          walletToId: true,
          userid: true,

          category: true,
          wallet: true,
          walletTo: true,
        },
        where: {
          userid: ctx.session.user.id,
        },
        take: 4,
        orderBy: {
          date: "desc",
        },
      }),
  ),
});
