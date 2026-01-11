import { z } from "zod";
import { Prisma } from "@paxol/db";

import { createManyTx, createTx } from "../handlers/transactions/create";
import { deleteTx } from "../handlers/transactions/delete";
import { updateTx } from "../handlers/transactions/update";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionWithJoins } from "../types";

const txValidator = z
  .object({
    amount: z.number(),
    date: z.string().datetime(),
    description: z.string(),
    walletId: z.string(),
  })
  .and(
    z.union([
      z.object({
        type: z.literal("t"),
        walletToId: z.string(),
      }),
      z.object({
        type: z.union([z.literal("i"), z.literal("o")]),
        categoryId: z.string(),
      }),
    ]),
  );

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

  bulkCreate: protectedProcedure
    .input(
      z.object({
        items: txValidator.array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await createManyTx({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        input: input.items,
      });
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          id: z.string(),
        })
        .and(txValidator),
    )
    .mutation(({ ctx, input }) =>
      updateTx({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        input,
      }),
    ),

  create: protectedProcedure.input(txValidator).mutation(({ ctx, input }) => {
    return createTx({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      input,
    });
  }),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    deleteTx({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      txId: input,
    }),
  ),

  getMonthlyComparison: protectedProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
        categoryIds: z.string().array().optional(),
        type: z.enum(["in", "out"]).default("out"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.from);
      const endDate = new Date(input.to);

      if (input.categoryIds?.length == 0) {
        input.categoryIds == undefined;
      }

      const transactions = await ctx.prisma.transaction.findMany({
        select: {
          amount: true,
          date: true,
        },
        where: {
          userid: ctx.session.user.id,
          categoryId:
            input.categoryIds?.length ?? 0 > 0
              ? { in: input.categoryIds }
              : undefined,
          category: { type: input.type },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      // Generate all month keys in the range and initialize with zero values
      const monthlyData: Record<
        string,
        { total: Prisma.Decimal; transactionCount: number }
      > = {};

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1,
        ).padStart(2, "0")}`;
        monthlyData[monthKey] = {
          total: new Prisma.Decimal(0),
          transactionCount: 0,
        };
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Group transactions by month
      transactions.forEach((tx) => {
        const monthKey = `${tx.date.getFullYear()}-${String(
          tx.date.getMonth() + 1,
        ).padStart(2, "0")}`;

        const monthData = monthlyData[monthKey];

        if (monthData !== undefined) {
          monthData.total = monthData.total.add(tx.amount);
          monthData.transactionCount++;

          monthlyData[monthKey] = monthData;
        }
      });

      // Convert to array and sort by date
      const result = Object.entries(monthlyData)
        .map(([monthKey, data]) => ({
          month: monthKey,
          monthName: new Date(monthKey + "-01").toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }),
          total: data.total.toDecimalPlaces(2).toNumber(),
          transactionCount: data.transactionCount,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return result;
    }),
});
