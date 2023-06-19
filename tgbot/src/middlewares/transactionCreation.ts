import { NextFunction } from "grammy";

import { MyContext } from "../types";

export const transactionCreation = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.session.transactionCreation) return await next();

  await ctx.reply(JSON.stringify(ctx.session.transactionCreation));
  await next();
};
