import { StatelessQuestion } from "@grammyjs/stateless-question";
import { parse } from "date-fns";
import { replyMenuToContext } from "grammy-inline-menu";

import { createTransaction } from "../menus";
import { MyContext } from "../types";

export const editDate = new StatelessQuestion<MyContext>(
  "edit-tx-date-question",
  async (ctx, state) => {
    if (!ctx.session.tx) return;

    const answer = ctx.message.text?.trim();

    if (answer && answer.toLocaleLowerCase() !== "esc") {
      try {
        ctx.session.tx.object.date = parse(
          answer,
          answer.includes(" ") ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy",
          new Date(),
        ).toISOString();
        ctx.session.tx.progress.hasDate = true;
      } catch {
        await editDate.replyWithMarkdown(
          ctx,
          "Risposta non valida, la data deve essere in formato dd/MM/yyyy HH:mm",
          state,
        );
        return;
      }
    }

    await replyMenuToContext(createTransaction.template, ctx, state);
  },
);

export const questionText =
  "Scrivi la data e ora in formato dd/MM/yyyy HH:mm (o 'esc' per annullare):";
