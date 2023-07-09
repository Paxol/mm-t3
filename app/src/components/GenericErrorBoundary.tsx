import { FC, PropsWithChildren } from "react";
import {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "./Button";

export const GenericErrorBoundary: FC<PropsWithChildren> = ({ children }) => (
  <QueryErrorResetBoundary>
    <Content>{children}</Content>
  </QueryErrorResetBoundary>
);

const Content: FC<PropsWithChildren> = ({ children }) => {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary, error }) => {
        console.error(error);

        return (
          <div className="my-4 flex flex-col items-center dark:text-white">
            <p className="mb-4">Si è verificato un errore</p>

            <Button onClick={resetErrorBoundary}>Riprova</Button>
          </div>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
