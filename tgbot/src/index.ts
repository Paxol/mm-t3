import * as process from "node:process";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { Bot, session } from "grammy";
import { prisma } from "@paxol/db";

import * as commands from "./commands";
import { connectUser } from "./middlewares/connectUser";
import { MyContext } from "./types";

const token = process.env["BOT_TOKEN"];
if (!token) {
  throw new Error(
    "You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)",
  );
}

const bot = new Bot<MyContext>(token);

bot.use(
  session({
    initial: () => ({}),
    storage: new PrismaAdapter(prisma.tgBotSession),
  }),
);

bot.use(connectUser);

commands.register(bot);

async function start(): Promise<void> {
  await commands.setSuggested(bot);

  await bot.start({
    onStart(botInfo) {
      console.log(new Date(), "Bot starts as", botInfo.username);
    },
  });
}

bot.on("message", (ctx) => {
  
});

start();
