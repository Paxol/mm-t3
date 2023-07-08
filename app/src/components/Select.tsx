import React from "react";

import { cn } from "~/utils/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onChange, onValueChange, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "text-sm text-black sm:text-base relative w-full border-2 rounded placeholder-gray-400 focus:border-gray-300 hover:border-gray-300 outline-none py-2 px-4 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-gray-500 dark:hover:border-gray-500 dark:text-white",
          className,
        )}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
