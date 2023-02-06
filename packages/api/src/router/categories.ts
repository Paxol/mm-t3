import { Category } from "@paxol/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const categoriesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }): Promise<Category[]> => {
    return await ctx.prisma.category.findMany({
      where: {
        userid: ctx.session.user.id,
      },
    });
  }),
});
