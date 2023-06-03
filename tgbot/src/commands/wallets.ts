import { prisma } from "@paxol/db";

import { MyContext } from "../types";

export const wallets = async (ctx: MyContext) => {
  if (!ctx.user) return;

  const wallets = await prisma.wallet.findMany({
    where: { userid: ctx.user.id, deleted: false },
  });

  if (wallets.length === 0) return await ctx.reply("Non ci sono conti registrati");

  await ctx.reply(
    ["Elenco dei conti:", ...wallets.map((w) => `- ${w.name}`)].join("\n"),
  );
};
