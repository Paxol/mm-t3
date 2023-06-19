import { prisma } from "@paxol/db";

export class DataAccess {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }

  getCategories(type = "in") {
    return prisma.category.findMany({
      where: {
        userid: this.userId,
        type,
      },
      orderBy: { name: "asc" },
    });
  }

  getCategory(id: string) {
    return prisma.category.findFirst({ where: { id } });
  }

  getWallets() {
    return prisma.wallet.findMany({
      where: { userid: this.userId },
      orderBy: { name: "asc" },
    });
  }

  getWallet(id: string) {
    return prisma.wallet.findFirst({ where: { id } });
  }
}
