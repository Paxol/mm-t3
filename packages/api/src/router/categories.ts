import { z } from "zod";
import { Category } from "@paxol/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const categoriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }): Promise<Category[]> => {
    return await ctx.prisma.category.findMany({
      where: {
        userid: ctx.session.user.id,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }, { id: "asc" }],
    });
  }),

  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["in", "out"]),
        atBalance: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<Category> => {
      return await ctx.prisma.category.create({
        data: {
          ...input,
          color: input.type === "in" ? "aaffaa" : "ffaaaa",
          userid: ctx.session.user.id,
        },
      });
    }),
});
