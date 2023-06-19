import { Bot } from "grammy";

import { MyContext } from "../types";
import * as createTransaction from "./createTransaction";

export const register = (bot: Bot<MyContext>) => {
  bot.use(createTransaction.middleware.middleware());
};

export { createTransaction };
