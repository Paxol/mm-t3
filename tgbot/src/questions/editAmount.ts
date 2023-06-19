import { StatelessQuestion } from "@grammyjs/stateless-question";
import { replyMenuToContext } from "grammy-inline-menu";

import { createTransaction } from "../menus";
import { MyContext } from "../types";

export const editAmount = new StatelessQuestion<MyContext>(
  "edit-tx-amount-question",
  async (ctx, state) => {
    if (!ctx.session.tx) return;

    const answer = ctx.message.text?.trim().replace(",", ".");

    if (answer?.toLocaleLowerCase() !== "esc") {
      const match = answer?.match(/(\d*\.\d+)|(\d+(\.\d+)?)/);
      const parsed = Number.parseFloat(match?.[0] ?? "a");

      if (Number.isNaN(parsed)) {
        await editAmount.replyWithMarkdown(
          ctx,
          "Risposta non valida, inserisci un numero",
          state,
        );
        return;
      }

      ctx.session.tx.object.amount = parsed;
      ctx.session.tx.progress.hasAmount = true;
    }

    await replyMenuToContext(createTransaction.template, ctx, state);
  },
);
