import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { Bot, session } from "grammy";
import { prisma } from "@paxol/db";

import * as commands from "./commands";
import { env } from "./env";
import * as menus from "./menus";
import * as middlewares from "./middlewares";
import * as questions from "./questions";
import { MyContext } from "./types";

console.log(menus.createTransaction.middleware.tree());

const bot = new Bot<MyContext>(env.BOT_TOKEN);

bot.use(
  session({
    initial: () => ({}),
    storage: new PrismaAdapter(prisma.tgBotSession),
  }),
);

middlewares.register(bot);
commands.register(bot);
menus.register(bot);
questions.register(bot);

async function start(): Promise<void> {
  await commands.setSuggested(bot);

  await bot.start({
    onStart(botInfo) {
      console.log(new Date(), "Bot starts as", botInfo.username);
    },
  });
}

start();
