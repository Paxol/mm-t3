import { PrismaClient } from "@paxol/db";

export type InputTx = {
  id?: string;
  amount: number;
  description: string;
  type: "i" | "o" | "t";
  categoryId: string | null;
  walletId: string;
  walletToId: string | null;
  date: string;
};


export type Tx = Awaited<ReturnType<typeof fetchTx>>;

export const fetchTx = (prisma: PrismaClient, txId: string, userId: string) =>
  prisma.transaction.findFirstOrThrow({
    select: {
      id: true,
      amount: true,
      date: true,
      description: true,
      type: true,
      future: true,
      categoryId: true,
      walletId: true,
      walletToId: true,
      userid: true,

      wallet: true,
      walletTo: true,
    },
    where: {
      id: txId,
      userid: userId,
    },
  });

export function fetchWallet(prisma: PrismaClient, walletId: string, userId: string) {
  return prisma.wallet.findFirstOrThrow({
    where: {
      id: walletId,
      userid: userId,
    },
  });
}
