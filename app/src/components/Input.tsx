import React from "react";
import classNames from "classnames";

export const Input: React.FC<
  (React.HTMLProps<HTMLInputElement> | React.HTMLProps<HTMLSelectElement>) & {
    select?: boolean;
    onValueChange?: (value: string) => void;
  }
> = ({ className = "", select = false, children, onValueChange, ...rest }) => {
  const classes = classNames({
    "text-sm text-black sm:text-base relative w-full border-2 rounded placeholder-gray-400 focus:border-gray-300 hover:border-gray-300 outline-none py-2 px-4 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-gray-500 dark:hover:border-gray-500 dark:text-white":
      true,
    [className]: true,
  });

  if (select) {
    return (
      <select
        className={classes}
        onChange={({ target: { value } }) =>
          onValueChange && onValueChange(value)
        }
        {...(rest as React.HTMLProps<HTMLSelectElement>)}
      >
        {children}
      </select>
    );
  } else {
    return (
      <input
        className={classes}
        onChange={({ target: { value } }) =>
          onValueChange && onValueChange(value)
        }
        {...(rest as React.HTMLProps<HTMLInputElement>)}
      />
    );
  }
};
