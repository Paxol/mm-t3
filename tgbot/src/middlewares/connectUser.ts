import { NextFunction } from "grammy";
import { prisma } from "@paxol/db";

import { MyContext } from "../types";

export const connectUser = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.chat) return await next();

  const user = await prisma.user.findFirst({
    where: { tgId: ctx.chat.id },
  });

  if (user) {
    ctx.user = user;
    return await next();
  }

  await ctx.reply(
    "Questa chat non è collegata a nessun utente, non puoi usare il bot",
  );
};
