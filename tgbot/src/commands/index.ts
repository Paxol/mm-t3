import { Bot } from "grammy";

import { MyContext } from "../types";
import { categories } from "./categories";
import { start } from "./start";
import { wallets } from "./wallets";

export const register = (bot: Bot<MyContext>) => {
  bot.command("start", start);
  bot.command("conti", wallets);
  bot.command("categorie", categories);
};

export const setSuggested = (bot: Bot<MyContext>) => {
  return bot.api.setMyCommands([
    { command: "start", description: "Avvia il bot" },
    { command: "conti", description: "Visualizza tutti i conti" },
    { command: "categorie", description: "Visualizza tutte le categorie" },
  ]);
};
