import { FC, PropsWithChildren } from "react";
import classNames from "classnames";

const paddingRegex = /(?<=\s|^)p[t|r|b|l|x|y]*-\S*/;

export const Card: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  const hasPadding = paddingRegex.test(className ?? "");

  const classes = classNames({
    "bg-white dark:bg-gray-800 flex flex-col rounded-md shadow-md": true,
    [className ?? ""]: className ? true : false,
    "px-6 py-4": !hasPadding,
  });

  return <div className={classes}>{children}</div>;
};
