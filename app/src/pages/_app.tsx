import "../styles/globals.css";
import "overlayscrollbars/overlayscrollbars.css";
import type { AppType } from "next/app";
import { Provider as JotaiProvider } from "jotai";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import { api } from "~/utils/api";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <JotaiProvider>
      <SessionProvider session={session}>
        <div className="h-screen bg-gray-700 flex flex-col">
          <OverlayScrollbarsComponent
            options={{ scrollbars: { autoHide: "scroll" } }}
            defer
          >
            <Component {...pageProps} />
          </OverlayScrollbarsComponent>
        </div>
      </SessionProvider>
    </JotaiProvider>
  );
};

export default api.withTRPC(MyApp);
