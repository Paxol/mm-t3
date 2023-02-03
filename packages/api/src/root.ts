import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
