import React, { FC, PropsWithChildren } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

const cardVariants = cva(
  "bg-card text-card-foreground flex rounded-md shadow-md px-6 py-4",
  {
    variants: {
      direction: {
        vertical: "flex-col",
        horizontal: "flex-row",
      },
    },
    defaultVariants: {
      direction: "vertical",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card: FC<PropsWithChildren<CardProps>> = ({
  className,
  direction,
  children,
  ...rest
}) => {
  return (
    <div className={cn(cardVariants({ direction, className }))} {...rest}>
      {children}
    </div>
  );
};
