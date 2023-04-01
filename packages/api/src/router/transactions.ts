import { z } from "zod";

import { createTx } from "../handlers/transactions/create";
import { deleteTx } from "../handlers/transactions/delete";
import { updateTx } from "../handlers/transactions/update";
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
          walletToId: true,
          userid: true,

          category: true,
          wallet: true,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number(),
        date: z.string().datetime(),
        description: z.string(),
        type: z.enum(["i", "o", "t"]),
        categoryId: z.string().nullable(),
        walletId: z.string(),
        walletToId: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateTx({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        input,
      }),
    ),

  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        date: z.string().datetime(),
        description: z.string(),
        type: z.enum(["i", "o", "t"]),
        categoryId: z.string().nullable(),
        walletId: z.string(),
        walletToId: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createTx({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        input,
      }),
    ),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    deleteTx({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      txId: input,
    }),
  ),
});
