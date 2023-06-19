import { StatelessQuestion } from "@grammyjs/stateless-question";
import { replyMenuToContext } from "grammy-inline-menu";

import { createTransaction } from "../menus";
import { MyContext } from "../types";

export const editDescription = new StatelessQuestion<MyContext>(
  "edit-tx-description-question",
  async (ctx, state) => {
    if (!ctx.session.tx) return;

    const answer = ctx.message.text?.trim();

    if (answer?.toLocaleLowerCase() !== "esc") {
      ctx.session.tx.object.description = answer;
      ctx.session.tx.progress.hasDescription = true;
    }

    await replyMenuToContext(createTransaction.template, ctx, state);
  },
);
