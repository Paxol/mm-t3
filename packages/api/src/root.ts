import { authRouter } from "./router/auth";
import { categoriesRouter } from "./router/categories";
import { dashboardRouter } from "./router/dashboard";
import { transactionsRouter } from "./router/transactions";
import { walletsRouter } from "./router/wallets";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  categories: categoriesRouter,
  transactions: transactionsRouter,
  wallets: walletsRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
