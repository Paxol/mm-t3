import { Bot } from "grammy";

import { MyContext } from "../types";
import { editAmount } from "./editAmount";
import { editDate } from "./editDate";
import { editDescription } from "./editDescription";

export const register = (bot: Bot<MyContext>) => {
  bot.use(editDescription.middleware());
  bot.use(editAmount.middleware());
  bot.use(editDate.middleware());
};

export { editDescription, editAmount, editDate };
