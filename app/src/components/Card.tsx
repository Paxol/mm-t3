import { FC, PropsWithChildren } from "react";

export const Card: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  let myClass = "bg-gray-800 flex flex-col px-6 py-4 rounded-md shadow-md";

  if (className) myClass = `${myClass} ${className}`;

  return <div className={myClass}>{children}</div>;
};
