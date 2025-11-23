import { TRPCError } from "@trpc/server";
import moment from "moment";
import { PrismaClient } from "@paxol/db";

import { InputTx } from "./common";

type CreateParams = {
  prisma: PrismaClient;
  userId: string;
  input: InputTx;
};

type CreateManyParams = {
  prisma: PrismaClient;
  userId: string;
  input: InputTx[];
};

export async function createTx({ input, prisma, userId }: CreateParams) {
  const future = moment().isBefore(input.date);

  if (future)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Future transactions, not implemented",
    });

  let walletAmount = 0;
  let walletToAmount: number | null = null;

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

    walletAmount = wallet.currentValue + amountDiff;
    walletToAmount = walletTo ? walletTo.currentValue - amountDiff : null;
  }

  const prismaActions = [
    prisma.transaction.create({
      data: {
        ...input,
        future,
        userid: userId,
      },
    }),

    prisma.wallet.update({
      data: { currentValue: walletAmount },
      where: { id: input.walletId },
    }),
  ];

  if (input.type == "t" && input.walletToId && walletToAmount !== null)
    prismaActions.push(
      prisma.wallet.update({
        data: { currentValue: walletToAmount },
        where: { id: input.walletToId },
      }),
    );

  await prisma.$transaction(prismaActions);
}

export async function createManyTx({
  prisma,
  userId,
  input,
}: CreateManyParams) {
  await prisma.$transaction(async (tx) => {
    for (const item of input) {
      const future = moment().isBefore(item.date);

      if (future)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Future transactions, not implemented",
        });

      let walletAmount = 0;
      let walletToAmount: number | null = null;

      const wallet = await tx.wallet.findFirstOrThrow({
        where: {
          id: item.walletId,
          userid: userId,
        },
      });

      const walletTo =
        item.type === "t"
          ? await tx.wallet.findFirstOrThrow({
              where: {
                id: item.walletToId ?? "",
                userid: userId,
              },
            })
          : null;

      const amountDiff = item.type === "i" ? item.amount : -item.amount;

      walletAmount = wallet.currentValue + amountDiff;
      walletToAmount = walletTo ? walletTo.currentValue - amountDiff : null;

      await tx.transaction.create({
        data: {
          ...item,
          future,
          userid: userId,
        },
      });

      await tx.wallet.update({
        data: { currentValue: walletAmount },
        where: { id: item.walletId },
      });

      if (item.type === "t" && item.walletToId && walletToAmount !== null) {
        await tx.wallet.update({
          data: { currentValue: walletToAmount },
          where: { id: item.walletToId },
        });
      }
    }
  });
}
