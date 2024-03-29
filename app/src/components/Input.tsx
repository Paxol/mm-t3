import React from "react";
import { cn } from "~/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (value: string) => void;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, onValueChange, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "text-sm text-black sm:text-base relative w-full border-2 rounded placeholder-gray-400 focus:border-gray-300 hover:border-gray-300 outline-none py-2 px-4 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-gray-500 dark:hover:border-gray-500 dark:text-white",
          className
        )}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
export { Input }