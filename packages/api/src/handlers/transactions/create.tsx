import { TRPCError } from "@trpc/server";
import moment from "moment";

import { ContextType } from "../../trpc";
import { InputTx } from "./common";

type CreateParams = {
  ctx: ContextType;
  input: InputTx;
};

export async function rawCreate(
  ctx: CreateParams["ctx"],
  input: CreateParams["input"],
) {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userId = ctx.session.user.id;
  const future = moment().isBefore(input.date);

  let walletAmount = 0;
  let walletToAmount: number | null = null;

  if (!future) {
    const wallet = await ctx.prisma.wallet.findFirstOrThrow({
      where: {
        id: input.walletId,
        userid: userId,
      },
    });

    const walletTo =
      input.type === "t"
        ? await ctx.prisma.wallet.findFirstOrThrow({
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
    ctx.prisma.transaction.create({
      data: {
        ...input,
        future,
        userid: userId,
      },
    }),

    ctx.prisma.wallet.update({
      data: { currentValue: walletAmount },
      where: { id: input.walletId },
    }),
  ];

  if (walletToAmount !== null && input.walletToId)
    prismaActions.push(
      ctx.prisma.wallet.update({
        data: { currentValue: walletToAmount },
        where: { id: input.walletToId },
      }),
    );

  return prismaActions;
}

export async function create({ ctx, input }: CreateParams) {
  const prismaActions = await rawCreate(ctx, input);

  if (prismaActions) await ctx.prisma.$transaction(prismaActions);
}
