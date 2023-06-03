import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { authRouter } from "./router/auth";
import { budgetsRouter } from "./router/budgets";
import { categoriesRouter } from "./router/categories";
import { dashboardRouter } from "./router/dashboard";
import { healthRouter } from "./router/health";
import { transactionsRouter } from "./router/transactions";
import { walletsRouter } from "./router/wallets";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  categories: categoriesRouter,
  budgets: budgetsRouter,
  transactions: transactionsRouter,
  wallets: walletsRouter,
  auth: authRouter,
  health: healthRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterOutputs = inferRouterOutputs<AppRouter>;
