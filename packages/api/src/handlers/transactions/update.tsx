import moment from "moment";
import { PrismaClient } from "@paxol/db";

import { fetchTx, type InputTx } from "./common";

type UpdateParams = {
  prisma: PrismaClient;
  userId: string;
  input: InputTx & { id: string };
};

export async function updateTx({ prisma, userId, input }: UpdateParams) {
  const oldTx = await fetchTx(prisma, input.id, userId);

  const future = moment().isBefore(input.date);

  const canRunSemplifiedMode =
    future === oldTx.future &&
    input.amount === oldTx.amount &&
    input.type === oldTx.type &&
    input.walletId === oldTx.walletId &&
    input.walletToId === oldTx.walletToId;

  if (canRunSemplifiedMode) {
    return prisma.transaction.update({
      data: {
        ...input,
        future: future,
      },
      where: {
        id: input.id,
      },
    });
  }

  await prisma.$transaction(async (prisma) => {
    if (!oldTx.future) {
      const amountDiff = oldTx.type === "i" ? -oldTx.amount : +oldTx.amount;

      const walletAmount = oldTx.wallet.currentValue + amountDiff;
      const walletAmountTo = oldTx.walletTo
        ? oldTx.walletTo.currentValue - amountDiff
        : null;

      await prisma.wallet.update({
        data: { currentValue: walletAmount },
        where: { id: oldTx.wallet.id },
      });

      if (walletAmountTo !== null && oldTx.walletTo)
        await prisma.wallet.update({
          data: { currentValue: walletAmountTo },
          where: { id: oldTx.walletTo.id },
        });
    }

    if (!future) {
      const wallet = await prisma.wallet.findFirstOrThrow({
        where: {
          id: input.walletId,
          userid: userId,
        },
      });

      const walletTo =
        input.type === "t"
          ? await prisma.wallet.findFirstOrThrow({
              where: {
                id: input.walletToId ?? "",
                userid: userId,
              },
            })
          : null;

      const amountDiff = input.type === "i" ? input.amount : -input.amount;

      const walletAmount = wallet.currentValue + amountDiff;
      const walletToAmount = walletTo
        ? walletTo.currentValue - amountDiff
        : null;

      await prisma.wallet.update({
        data: { currentValue: walletAmount },
        where: { id: input.walletId },
      });

      if (walletToAmount !== null && input.walletToId)
        await prisma.wallet.update({
          data: { currentValue: walletToAmount },
          where: { id: input.walletToId },
        });
    }

    await prisma.transaction.upsert({
      create: {
        ...input,
        future,
        userid: userId,
      },
      update: {
        ...input,
        future,
      },
      where: { id: input.id },
    });
  });
}
