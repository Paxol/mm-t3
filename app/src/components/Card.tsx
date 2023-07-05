import React, { FC, PropsWithChildren } from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "~/utils/cn";

const cardVariants = cva(
  "bg-white dark:bg-gray-800 flex rounded-md shadow-md px-6 py-4",
  {
    variants: {
      orientation: {
        vertical: "flex-col",
        horizontal: "flex-row",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card: FC<PropsWithChildren<CardProps>> = ({
  className,
  orientation,
  children,
}) => {
  return (
    <div className={cn(cardVariants({ orientation, className }))}>
      {children}
    </div>
  );
};
