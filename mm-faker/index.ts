import confirm from "@inquirer/confirm";
import select from "@inquirer/select";
import { z } from "zod";
import { fake, install, seed } from "zod-schema-faker";
import { PrismaClient } from "@paxol/db";

async function App() {
  const runFaker = await confirm({
    message:
      "Welcome to mm-faker! Are you sure you to generate and save fake data to the database using the following connection string?\n" + process.env.DATABASE_URL,
    default: false,
  });

  if (!runFaker) process.exit(0);

  const prisma = new PrismaClient();

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  const selectedUserId = await select({
    message: "Select a user",
    choices: users.map((user) => ({
      name: user.email ?? user.id,
      value: user.id,
    })),
  });

  const [inCategories, outCategories, wallets] = await Promise.all([
    prisma.category.findMany({ where: { userid: selectedUserId, type: "in" } }),
    prisma.category.findMany({
      where: { userid: selectedUserId, type: "out" },
    }),
    prisma.wallet.findMany({
      where: { userid: selectedUserId, deleted: false },
    }),
  ]);

  const start = startOfMonth(new Date());
  const end = new Date();

  const txPerDay = 5;
  const totalTx = (end.getDate() - start.getDate()) * txPerDay;

  const fakerSchema = z
    .object({
      amount: z.number().min(0.01).max(130),
      date: z.date().min(start).max(end),
      description: z.string().max(50),
    });

  install();

  seed(totalTx);

  const txs = [];
  for (let i = 0; i < totalTx; i++) {
    let type: "i" | "o" | "t";
    let categoryId = undefined;
    let walletToId = undefined;
    
    const walletId = wallets[Math.floor(Math.random() * wallets.length)]!.id;

    const random = Math.random();
    if (random < 0.4) {
      type = "i";
      categoryId = inCategories[Math.floor(Math.random() * inCategories.length)]!.id;
    } else if (random < 0.8) {
      type = "o";
      categoryId = outCategories[Math.floor(Math.random() * inCategories.length)]!.id;
    } else {
      type = "t";
      const otherWallets = wallets.filter(w => w.id != walletId);
      walletToId = otherWallets[Math.floor(Math.random() * otherWallets.length)]!.id;
    }

    const {date, ...faked} = fake(fakerSchema);

    const tx = {
      categoryId,
      walletToId,
      type,
      walletId,
      date: date.toISOString(),
      ...faked,
    } satisfies InputTx;

    txs.push(tx);
  }

  console.log(`Generated ${txs.length} transactions, saving to the database...`);

  for (const tx of txs) {
    await createTx({ prisma, userId: selectedUserId, input: tx });
  }

  console.log("Done!");
}

(async () => {
  await App();
})();

// Helper functions

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// boh

type InputTx = {
  id?: string;
  amount: number;
  date: string;
  description: string;
  walletId: string;
  type: "t" | "i" | "o";
  walletToId?: string;
  categoryId?: string;
}

type CreateParams = {
  prisma: PrismaClient;
  userId: string;
  input: InputTx;
};

export async function createTx({ input, prisma, userId }: CreateParams) {
  let walletAmount = 0;
  let walletToAmount: number | null = null;

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

  const prismaActions = [
    prisma.transaction.create({
      data: {
        ...input,
        future: false,
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
