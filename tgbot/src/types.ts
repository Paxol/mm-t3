import { Context, SessionFlavor } from "grammy";
import { User } from "@paxol/db";

import { DataAccess } from "./dal";
import { TxState } from "./logic/txParser";
import { TrcpInputs, TrpcCaller } from "./middlewares/api";

export type TransactionPartial = Partial<TrcpInputs["transactions"]["create"]>;

export interface SessionData {
  transactionCreation?: TransactionPartial;
  tx?: TxState;
  categoryPagination?: number;
  walletPagination?: number;
  walletToPagination?: number;
}

type ContextExtensions = {
  trpc?: TrpcCaller;
  user?: User;
  dal?: DataAccess;
};

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ContextExtensions;
