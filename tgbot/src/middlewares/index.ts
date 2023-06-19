import { Bot } from "grammy";

import { MyContext } from "../types";
import { api } from "./api";
import { connectUser } from "./connectUser";
import { injectDataAccess } from "./injectDataAccess";

export const register = (bot: Bot<MyContext>) => {
  bot.use(connectUser);
  bot.use(api);
  bot.use(injectDataAccess);
};
