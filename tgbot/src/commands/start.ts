import { MyContext } from "../types";

export const start = (ctx: MyContext) => {
  ctx.reply("Scrivi i dettagli di una transazione, porverò a inserirla, oppure usa i comandi");
};
