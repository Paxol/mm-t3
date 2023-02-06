import classNames from "classnames";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  big?: boolean;
  lg?: boolean;
  outline?: boolean;
  invert?: boolean;
  shadow?: boolean;
  className?: string;
}

export const Button: React.FC<Props> = ({
  className = "",
  children,
  big = false,
  lg = false,
  outline = false,
  shadow = false,
  invert = false,
  ...rest
}) => {
  const classes = classNames({
    [className]: true,
    "items-center justify-center px-4 py-2 font-medium rounded-md hover:shadow-md":
      true,

    // Shadow without focus
    "shadow-sm": shadow,

    // Focus feedback
    "focus:outline-none": true,
    "focus:ring-4 focus:ring-gray-500": true,

    // Bg and txt colors
    "bg-white hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-800 text-black dark:text-white":
      !invert,
    "bg-gray-800 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black":
      invert,

    // Big button style
    "text-sm": !big,
    "px-5 py-3": big,

    // Large
    "w-full": lg || big,

    // Outline
    "border-2 border-gray-400 hover:border-white": outline,
    "border border-transparent": !outline,
  });

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};
