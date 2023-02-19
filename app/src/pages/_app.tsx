import "../styles/globals.css";
import type { AppType } from "next/app";
import { Provider as JotaiProvider } from "jotai";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "~/utils/api";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <JotaiProvider>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </JotaiProvider>
  );
};

export default api.withTRPC(MyApp);
