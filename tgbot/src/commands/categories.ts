import { prisma } from "@paxol/db";

import { MyContext } from "../types";

export const categories = async (ctx: MyContext) => {
  if (!ctx.user) return;

  const incomes = await prisma.category.findMany({
    where: { userid: ctx.user.id, type: "in" },
    orderBy: { name: "asc" },
  });

  const expenses = await prisma.category.findMany({
    where: { userid: ctx.user.id, type: "out" },
    orderBy: { name: "asc" },
  });

  if (incomes.length === 0 && expenses.length === 0)
    return await ctx.reply("Non ci sono categorie registrate");

  await ctx.reply(
    ["Elenco categorie entrate:", ...incomes.map((w) => `- ${w.name}`)].join(
      "\n",
    ),
  );
  await ctx.reply(
    ["Elenco categorie uscite:", ...expenses.map((w) => `- ${w.name}`)].join(
      "\n",
    ),
  );
};
