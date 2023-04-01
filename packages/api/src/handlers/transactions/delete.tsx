import moment from "moment";
import { PrismaClient } from "@paxol/db";

type DeleteParams = {
  prisma: PrismaClient;
  userId: string;
  txId: string;
};

export async function deleteTx({prisma, txId, userId}: DeleteParams) {
  const tx = await prisma.transaction.findFirstOrThrow({
    select: {
      id: true,
      type: true,
      date: true,
      wallet: true,
      walletTo: true,
      amount: true,
    },
    where: {
      id: txId,
      userid: userId,
    },
  });

  const future = moment().isBefore(tx.date);

  let walletAmount = 0;
  let walletToAmount: number | null = null;

  if (future) {
    await prisma.transaction.delete({
      where: {
        id: txId,
      },
    });

    return;
  }

  const wallet = tx.wallet;
  const walletTo = tx.walletTo;

  const amountDiff = tx.type === "i" ? -tx.amount : +tx.amount;

  walletAmount = wallet.currentValue + amountDiff;
  walletToAmount = walletTo ? walletTo.currentValue - amountDiff : null;

  const prismaActions = [
    prisma.transaction.delete({
      where: {
        id: tx.id,
      },
    }),
    prisma.wallet.update({
      data: { currentValue: walletAmount },
      where: { id: tx.wallet.id },
    }),
  ];

  if (walletToAmount !== null && tx.walletTo)
    prismaActions.push(
      prisma.wallet.update({
        data: { currentValue: walletToAmount },
        where: { id: tx.walletTo.id },
      }),
    );

  await prisma.$transaction(prismaActions);
}
