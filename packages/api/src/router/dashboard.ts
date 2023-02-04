import moment from "moment/moment";
import { Category, Wallet } from "@paxol/db";

// import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  // all: publicProcedure.query(({ ctx }) => {
  //   return ctx.prisma.post.findMany({ orderBy: { id: "desc" } });
  // }),
  // byId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
  //   return ctx.prisma.post.findFirst({ where: { id: input } });
  // }),
  // create: publicProcedure
  //   .input(z.object({ title: z.string(), content: z.string() }))
  //   .mutation(({ ctx, input }) => {
  //     return ctx.prisma.post.create({ data: input });
  //   }),
  // delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
  //   return ctx.prisma.post.delete({ where: { id: input } });
  // }),

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
          walletFromId: true,
          walletToId: true,
          userid: true,

          category: true,
          wallet: true,
          walletFrom: true,
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

export type TransactionWithJoins = {
  category: Category | null;
  wallet: Wallet | null;
  walletFrom: Wallet | null;
  walletTo: Wallet | null;
  id: string;
  amount: number;
  description: string;
  type: string;
  categoryId: string | null;
  walletId: string | null;
  walletFromId: string | null;
  walletToId: string | null;
  userid: string;
  date: Date;
  future: boolean;
};
