import { NextFunction } from "grammy";

import { MyContext } from "../types";
import { DataAccess } from "../dal";

export const injectDataAccess = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.user) return await next();

  const dal = new DataAccess(ctx.user.id);
  ctx.dal = dal;

  return await next();
};
