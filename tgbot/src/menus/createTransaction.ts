import { format, getMinutes, parse } from "date-fns";
import {
  MenuMiddleware,
  MenuTemplate,
  getMenuOfPath,
} from "grammy-inline-menu";
import { CallbackButtonTemplate } from "grammy-inline-menu/dist/source/keyboard";

import { txToString } from "../logic/txParser";
import { editAmount, editDate, editDescription } from "../questions";
import { questionText as editDateQuestion } from "../questions/editDate";
import { MyContext } from "../types";
import { typeToString } from "../utils/txTypeConverter";

const menu = new MenuTemplate<MyContext>((ctx) => {
  console.log(ctx.session.tx);
  return `Crea transazione\n\n${txToString(ctx.session.tx) ?? ""}`;
});

menu.submenu(
  (ctx) => `${ctx.session.tx?.progress.hasType ? "Modifica" : "Aggiungi"} Tipo`,
  "tx-edit-type",
  getChooseTypeSubMenu(),
);

menu.submenu(
  (ctx) =>
    `${
      ctx.session.tx?.progress.hasCategory ? "Modifica" : "Aggiungi"
    } Categoria`,
  "tx-edit-category",
  getEditCategorySubMenu(),
  {
    hide: (ctx) =>
      !ctx.session.tx?.object.type || ctx.session.tx.object.type === "t",
  },
);

menu.submenu(
  (ctx) =>
    `${ctx.session.tx?.progress.hasWallet ? "Modifica" : "Aggiungi"} ${
      ctx.session.tx?.object.type !== "t" ? "Conto" : "Conto Partenza"
    }`,
  "tx-edit-wallet",
  getEditWalletSubMenu(),
);

menu.submenu(
  (ctx) =>
    `${
      ctx.session.tx?.progress.hasWalletTo ? "Modifica" : "Aggiungi"
    } Conto Destinazione`,
  "tx-edit-wallet-to",
  getEditWalletSubMenu(true),
  {
    hide: (ctx) => ctx.session.tx?.object.type !== "t",
  },
);

menu.submenu(
  (ctx) => `${ctx.session.tx?.progress.hasDate ? "Modifica" : "Aggiungi"} Data`,
  "tx-edit-date",
  getEditDateSubMenu(),
);

menu.interact(
  (ctx) =>
    `${ctx.session.tx?.progress.hasAmount ? "Modifica" : "Aggiungi"} Prezzo`,
  "tx-edit-price",
  {
    do: async (ctx, path) => {
      const additionalState = getMenuOfPath(path);
      await editAmount.replyWithMarkdown(
        ctx,
        "Scrivi il nuovo prezzo (o 'esc' per annullare):",
        additionalState,
      );

      return false;
    },
  },
);

menu.interact(
  (ctx) =>
    `${
      ctx.session.tx?.progress.hasDescription ? "Modifica" : "Aggiungi"
    } Descrizione`,
  "tx-edit-description",
  {
    do: async (ctx, path) => {
      const additionalState = getMenuOfPath(path);
      await editDescription.replyWithMarkdown(
        ctx,
        "Scrivi la nuova descrizione (o 'esc' per annullare):",
        additionalState,
      );

      return false;
    },
  },
);

const menuMiddleware = new MenuMiddleware("/", menu);

export const template = menu;
export const middleware = menuMiddleware;

function getChooseTypeSubMenu() {
  const typeMap = new Map<string, string>([
    ["i", "Entrata"],
    ["o", "Uscita"],
    ["t", "Trasferimento"],
  ]);

  const chooseTypeSubMenu = new MenuTemplate<MyContext>(
    (ctx) =>
      `Tipo: ${typeToString(
        ctx.session.tx?.object.type,
      )}\n\nScegli il nuovo tipo:`,
  );

  chooseTypeSubMenu.choose("chose-type", typeMap, {
    do(ctx, value) {
      if (!ctx.session.tx) return true;

      if (ctx.session.tx.object.type !== value) {
        ctx.session.tx.object.category = undefined;
        ctx.session.tx.progress.hasCategory = false;
      }

      ctx.session.tx.object.type = value;
      return true;
    },
    columns: 2,
  });

  chooseTypeSubMenu.manualRow(createBackButtons());
  return chooseTypeSubMenu;
}

function getEditDateSubMenu() {
  const chooseDateSubMenu = new MenuTemplate<MyContext>(
    (ctx) =>
      `Data: ${format(
        ctx.session.tx && ctx.session.tx.object.date
          ? new Date(ctx.session.tx.object.date)
          : new Date(),
        "dd/MM/yyyy HH:mm",
      )}\n\nScegli la nuova data:`,
  );

  chooseDateSubMenu.choose(
    "chose-tx-date-submenu",
    () => {
      const date = new Date();
      const minutes = getMinutes(date);
      date.setMinutes(minutes - (minutes % 5));
      const nowKey = format(date, "dd-MM-yyyy HH:mm");
      const nowValue = format(date, "dd/MM/yyyy HH:mm");

      return new Map<string, string>([
        [nowKey, nowValue],
        ["custom", "Inserisci"],
      ]);
    },
    {
      async do(ctx, value) {
        if (!ctx.session.tx) return true;

        if (value === "custom") {
          await editDate.replyWithMarkdown(ctx, editDateQuestion, "/");
          return true;
        }

        ctx.session.tx.object.date = parse(
          value,
          "dd-MM-yyyy HH:mm",
          new Date(),
        ).toISOString();
        ctx.session.tx.progress.hasDate = true;

        return true;
      },
      columns: 1,
    },
  );

  chooseDateSubMenu.manualRow(createBackButtons());
  return chooseDateSubMenu;
}

function getEditCategorySubMenu() {
  const chooseCategorySubMenu = new MenuTemplate<MyContext>((ctx) => {
    const tx = ctx.session.tx;
    const categoryText =
      tx && tx.progress.hasCategory && tx.object.category
        ? tx.object.category.name
        : "non impostata";

    return `Categoria: ${categoryText}`;
  });

  chooseCategorySubMenu.choose(
    "chose-tx-cat",
    async (ctx) => {
      let type = "in";
      if (ctx.session.tx?.object.type === "i") type = "in";
      if (ctx.session.tx?.object.type === "o") type = "out";

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const categories = await ctx.dal!.getCategories(type);

      const map = new Map<string, string>();
      for (let i = 0; i < categories.length; i++)
        map.set(categories[i].id, categories[i].name);

      return map;
    },
    {
      async do(ctx, id) {
        if (!ctx.session.tx) return true;

        const category = await ctx.dal?.getCategory(id);

        if (category) {
          ctx.session.tx.progress.hasCategory = true;
          ctx.session.tx.object.category = {
            id: category.id,
            name: category.name,
            type: category.type,
          };
        } else await ctx.reply("La categoria non è stata trovata");

        return true;
      },
      columns: 2,
      maxRows: 5,
      getCurrentPage: (ctx) => ctx.session.categoryPagination ?? 0,
      setPage: (ctx, page) => {
        ctx.session.categoryPagination = page;
      },
    },
  );

  chooseCategorySubMenu.manualRow(createBackButtons());
  return chooseCategorySubMenu;
}

function getEditWalletSubMenu(isWalletTo = false) {
  const chooseWalletSubMenu = new MenuTemplate<MyContext>((ctx) => {
    const tx = ctx.session.tx;
    const wallet = isWalletTo ? tx?.object.walletTo : tx?.object.wallet;

    const walletText = wallet ? wallet.name : "non impostato";

    return `${
      tx?.object.type === "t"
        ? `Conto ${isWalletTo ? "Destinazione" : "Partenza"}`
        : "Conto"
    }: ${walletText}`;
  });

  chooseWalletSubMenu.choose(
    "chose-tx-wal",
    async (ctx) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wallets = await ctx.dal!.getWallets();

      const map = new Map<string, string>();
      for (let i = 0; i < wallets.length; i++)
        map.set(wallets[i].id, wallets[i].name);

      return map;
    },
    {
      async do(ctx, id) {
        if (!ctx.session.tx) return true;

        const wallet = await ctx.dal?.getWallet(id);

        if (!wallet) {
          await ctx.reply("Il conto non è stato trovato");
        } else {
          if (isWalletTo) {
            ctx.session.tx.progress.hasWalletTo = true;
            ctx.session.tx.object.walletTo = {
              id: wallet.id,
              name: wallet.name,
            };
          } else {
            ctx.session.tx.progress.hasWallet = true;
            ctx.session.tx.object.wallet = {
              id: wallet.id,
              name: wallet.name,
            };
          }
        }

        return true;
      },
      columns: 2,
      maxRows: 5,
      getCurrentPage: (ctx) =>
        (isWalletTo
          ? ctx.session.walletToPagination
          : ctx.session.walletPagination) ?? 0,
      setPage: (ctx, page) => {
        if (isWalletTo) ctx.session.walletToPagination = page;
        else ctx.session.walletPagination = page;
      },
    },
  );

  chooseWalletSubMenu.manualRow(createBackButtons());
  return chooseWalletSubMenu;
}

function createBackButtons<Context>(
  text = "🔙 Torna indietro",
): (context: Context, path: string) => Promise<CallbackButtonTemplate[][]> {
  return async () => {
    const row: CallbackButtonTemplate[] = [];

    row.push({
      relativePath: "..",
      text,
    });

    return [row];
  };
}
