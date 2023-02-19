import moment from "moment/moment";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionWithJoins } from "../types";

export const dashboardRouter = createTRPCRouter({
  data: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findFirstOrThrow({
      select: {
        Wallets: {
          where: {
            deleted: false,
          },
        },
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
            },
          },
        },
      },
      where: {
        id: ctx.session.user.id,
      },
    });
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
