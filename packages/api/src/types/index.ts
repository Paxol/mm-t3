import { Category, Wallet } from "@paxol/db";

export type TransactionWithJoins = {
  category: Category | null;
  wallet: Wallet | null;
  walletTo: Wallet | null;
  id: string;
  amount: number;
  description: string;
  type: string;
  categoryId: string | null;
  walletId: string | null;
  walletToId: string | null;
  userid: string;
  date: Date;
  future: boolean;
};
