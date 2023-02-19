import { TRPCError } from "@trpc/server";
import moment from "moment";

import { ContextType } from "../../trpc";

type DeleteParams = {
  ctx: ContextType;
  input: string;
};

export async function rawDelete(ctx: DeleteParams["ctx"], txId: string) {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userId = ctx.session.user.id;
  const tx = await ctx.prisma.transaction.findFirstOrThrow({
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
    await ctx.prisma.transaction.delete({
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
    ctx.prisma.transaction.delete({
      where: {
        id: tx.id,
      },
    }),
    ctx.prisma.wallet.update({
      data: { currentValue: walletAmount },
      where: { id: tx.wallet.id },
    }),
  ];

  if (walletToAmount !== null && tx.walletTo)
    prismaActions.push(
      ctx.prisma.wallet.update({
        data: { currentValue: walletToAmount },
        where: { id: tx.walletTo.id },
      }),
    );

  return prismaActions;
}

export async function deleteFn({ ctx, input: txId }: DeleteParams) {
  const prismaActions = await rawDelete(ctx, txId);

  if (prismaActions) await ctx.prisma.$transaction(prismaActions);
}
