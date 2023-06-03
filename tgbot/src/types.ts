import { Context, SessionFlavor } from "grammy";
import { User } from "@paxol/db";
import { TrcpInputs, TrpcCaller } from "./middlewares/api";

export type TransactionPartial = Partial<TrcpInputs["transactions"]["create"]>

export interface SessionData {
  transactionCreation?: TransactionPartial;
}

type ContextExtensions = {
  trpc?: TrpcCaller,
  user?: User;
};

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ContextExtensions;
