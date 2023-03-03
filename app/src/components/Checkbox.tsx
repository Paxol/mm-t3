export const Checkbox: React.FC<
  React.PropsWithChildren<{
    checked: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }>
> = ({ children, checked, onChange }) => {
  return (
    <label className="flex justify-start items-center">
      <div className="bg-white dark:bg-gray-700 dark:border-gray-600 border-2 rounded border-gray-300 w-5 h-5 flex shrink-0 justify-center items-center mr-2 focus-within:border-blue-500">
        <input
          type="checkbox"
          className="opacity-0 absolute"
          checked={checked}
          onChange={onChange}
        />
        <svg
          className="fill-current hidden w-3 h-3 text-green-500 pointer-events-none"
          viewBox="0 0 20 20"
        >
          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
        </svg>
      </div>
      <div className="select-none dark:text-white">{children}</div>
    </label>
  );
};
