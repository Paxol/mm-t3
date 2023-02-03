import { PrismaClient } from "@prisma/client";

const restoreCategories = true;
const restoreWallets = true;
const restoreTransactions = true;
const restoreSavedTransactions = true;

async function cretateCategories(categories, type) {
  const data = Object.entries(categories).map(([k, v]) => ({
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

async function createWallets(wallets) {
  const data = Object.entries(wallets).map(([k, v]) => {
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

async function createTransactions(transactions, categoriesMapping, walletMapping) {
  const data = Object.entries(transactions).map(([k,tx]) => {
    return {
      userid,

      amount: Number(tx.amount),
      date: new Date(tx.date ?? "1970"),
      description: tx.description || "",
      future: tx.future,
      type: tx.type,

      categoryId: categoriesMapping.get(tx.category) || undefined,
      walletId: tx.wallet && walletMapping.get(tx.wallet),
      walletFromId: tx.wallet_from && walletMapping.get(tx.wallet_from),
      walletToId: tx.wallet_to && walletMapping.get(tx.wallet_to),
    }
  })

  await prisma.transaction.createMany({data});
}

async function createSavedTransactions(saved_transactions, categoriesMapping, walletMapping) {
  const data = Object.entries(saved_transactions).map(([oldid, tx]) => {    
    return {
      userid,
      
      amount: Number(tx.amount),
      description: tx.description,
      type: tx.type,
      
      categoryId: categoriesMapping.get(tx.category) || undefined,
      walletId: tx.wallet && walletMapping.get(tx.wallet),
      walletFromId: tx.wallet_from && walletMapping.get(tx.wallet_from),
      walletToId: tx.wallet_to && walletMapping.get(tx.wallet_to),
    }
  })

  await prisma.savedTransaction.createMany({data});
}
import backup from "./backup.json" assert { type: "json" };

const prisma = new PrismaClient();

const userid = 1;

if (restoreCategories) {
  await cretateCategories(backup.categories.in, "in");
  await cretateCategories(backup.categories.out, "out");
}

if (restoreWallets) {
  await createWallets(backup.wallets);
}

const categoriesMapping = new Map();
const walletMapping = new Map();

(await prisma.category.findMany({
  select: {
    id: true, 
    oldId: true,
  },
  where: {
    userid
  }
})).forEach(({id, oldId}) => {
    categoriesMapping.set(oldId, id)
  });

(await prisma.wallet.findMany({
  select: {
    id: true, 
    oldId: true,
  },
  where: {
    userid
  }
})).forEach(({id, oldId}) => {
  walletMapping.set(oldId, id)
})

if (restoreTransactions) {
  await createTransactions(backup.transactions, categoriesMapping, walletMapping);
}

if (restoreSavedTransactions) {
  await createSavedTransactions(backup.saved_transactions, categoriesMapping, walletMapping);
}
