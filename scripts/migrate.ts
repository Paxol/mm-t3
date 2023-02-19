import { PrismaClient } from "@prisma/client";
import backup from "./backup.json";

const prisma = new PrismaClient();

const userid = "cle9pio4f0000vhmeo3iew039";

const restoreCategories = true;
const restoreWallets = true;
const restoreTransactions = true;
const restoreSavedTransactions = true;

type BackupCategory = {
  balance: boolean;
  color: string;
  name: string;
}
type BackupWallet = {
  archiviato?: boolean | string;
  current: number | string;
  init: number | string;
  name: string;
  tipo: number;
  id: string;
}
type BackupTransaction = {
  amount: number;
  date: string;
  description: string;
  future: boolean;
  type: string;

  category: string;
  wallet?: string;
  wallet_from?: string;
  wallet_to?: string;
}
type BackupSavedTransaction = {
  amount: number;
  date: string;
  description: string;
  future: boolean;
  type: string;

  category: string;
  wallet?: string;
  wallet_from?: string;
  wallet_to?: string;
}

async function cretateCategories(categories: [string, BackupCategory][], type: "in" | "out") {
  const data = categories.map(([k, v]) => ({
    atBalance: v.balance,
    name: v.name,
    color: v.color,
    type: type,
    oldId: k,
    userid
  }));

  await prisma.category.createMany({
    data
  })
}

async function createWallets(wallets: [string, BackupWallet][]) {
  const data = wallets.map(([k, v]) => {
    const wallet = v

    return {
      oldId: k,
      userid,

      deleted: typeof wallet.archiviato === "string" ? wallet.archiviato === "true" : wallet.archiviato === true,
      currentValue: Number(wallet.current),
      initialValue: Number(wallet.init),
      name: wallet.name,
      type: wallet.tipo,
    }
  })

  await prisma.wallet.createMany({
    data
  })
}

async function createTransactions(transactions: [string, BackupTransaction][], categoriesMapping: Map<string, string>, walletMapping: Map<string, string>) {
  const data = transactions.map(([k, tx]) => {
    return {
      userid,

      amount: Number(tx.amount),
      date: new Date(tx.date ?? "1970"),
      description: tx.description || "",
      future: tx.future,
      type: tx.type,

      categoryId: categoriesMapping.get(tx.category) || undefined,
      walletId: tx.type !== 't' ? tx.wallet && walletMapping.get(tx.wallet) : tx.wallet_from && walletMapping.get(tx.wallet_from),
      walletToId: tx.wallet_to && walletMapping.get(tx.wallet_to),
    }
  })

  // @ts-ignore
  await prisma.transaction.createMany({ data });
}

async function createSavedTransactions(saved_transactions: [string, BackupSavedTransaction][], categoriesMapping: Map<string, string>, walletMapping: Map<string, string>) {
  const data = saved_transactions.map(([oldid, tx]) => {
    return {
      userid,

      amount: Number(tx.amount),
      description: tx.description,
      type: tx.type,

      categoryId: categoriesMapping.get(tx.category) || undefined,
      walletId: (tx.wallet && walletMapping.get(tx.wallet)) ?? (tx.wallet_from && walletMapping.get(tx.wallet_from)),
      walletToId: tx.wallet_to && walletMapping.get(tx.wallet_to),
    }
  })

  // @ts-ignore
  await prisma.savedTransaction.createMany({ data });
}

(async () => {
  if (restoreCategories) {
    // @ts-ignore
    await cretateCategories(Object.entries(backup.categories.in), "in");
    // @ts-ignore
    await cretateCategories(Object.entries(backup.categories.out), "out");
  }

  if (restoreWallets) {
    // @ts-ignore
    await createWallets(Object.entries(backup.wallets));
  }

  const categoriesMapping = new Map<string, string>();
  const walletMapping = new Map<string, string>();

  (await prisma.category.findMany({
    select: {
      id: true,
      oldId: true,
    },
    where: {
      userid
    }
  })).forEach(({ id, oldId }) => {
    categoriesMapping.set(oldId ?? "undefined", id)
  });

  (await prisma.wallet.findMany({
    select: {
      id: true,
      oldId: true,
    },
    where: {
      userid
    }
  })).forEach(({ id, oldId }) => {
    walletMapping.set(oldId ?? "undefined", id)
  })

  if (restoreTransactions) {
    // @ts-ignore
    await createTransactions(Object.entries(backup.transactions), categoriesMapping, walletMapping);
  }

  if (restoreSavedTransactions) {
    // @ts-ignore
    await createSavedTransactions(Object.entries(backup.saved_transactions), categoriesMapping, walletMapping);
  }
})()
  .finally(() => console.log("Done"))