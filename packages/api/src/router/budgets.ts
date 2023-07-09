import { z } from "zod";
import { Budget, BudgetType } from "@paxol/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const budgetsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.budget.findMany({
      include: { category: true },
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),

  add: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(BudgetType),
        amount: z.number().positive(),
        categoryId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<Budget> => {
      return await ctx.prisma.budget.create({
        data: {
          amount: input.amount,
          type: input.type,
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        type: z.nativeEnum(BudgetType),
        amount: z.number().positive(),
        categoryId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<Budget> => {
      await ctx.prisma.category.findFirstOrThrow({
        where: {
          id: input.categoryId,
          userid: ctx.session.user.id,
        },
      });

      await ctx.prisma.budget.updateMany({
        data: {
          amount: input.amount,
          type: input.type,
          categoryId: input.categoryId,
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return await ctx.prisma.budget.findFirstOrThrow({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.budget.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),
});
