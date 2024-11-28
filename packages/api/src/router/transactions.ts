import { z } from "zod";

import { createTx } from "../handlers/transactions/create";
import { deleteTx } from "../handlers/transactions/delete";
import { updateTx } from "../handlers/transactions/update";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionWithJoins } from "../types";

const txValidator = z.object({
  amount: z.number(),
  date: z.string().datetime(),
  description: z.string(),
  walletId: z.string(),
}).and(z.union([
  z.object({
    type: z.literal("t"),
    walletToId: z.string(),
  }),
  z.object({
    type: z.union([z.literal("i"), z.literal("o")]),
    categoryId: z.string(),
  }),
]));

export const transactionsRouter = createTRPCRouter({
  getRange: protectedProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
        categories: z.string().array().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<TransactionWithJoins[]> => {
      return await ctx.prisma.transaction.findMany({
        include: {
          category: true,
          wallet: true,
          walletTo: true,
        },
        where: {
          userid: ctx.session.user.id,
          categoryId: input.categories ? { in: input.categories } : undefined,

          date: {
            gte: new Date(input.from),
            lte: new Date(input.to),
          },
        },
        orderBy: { date: "desc" },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }).and(txValidator),
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
      txValidator
    )
    .mutation(({ ctx, input }) => {
      return createTx({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        input,
      })
    }
    ),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    deleteTx({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      txId: input,
    }),
  ),
});
