import { NextFunction } from "grammy";
import { appRouter, type RouterInputs, type RouterOutputs } from "@paxol/api";
import { prisma } from "@paxol/db";

import { MyContext } from "../types";

export const api = async (ctx: MyContext, next: NextFunction) => {
  if (ctx.user) ctx.trpc = createApi(ctx.user.id);

  return await next();
};

export type TrpcCaller = ReturnType<typeof createApi>;

export const createApi = (userId: string) =>
  appRouter.createCaller({
    prisma,
    session: {
      expires: "",
      user: { id: userId },
    },
  });

export type TrcpInputs = RouterInputs;
export type TrcpOutputs = RouterOutputs;