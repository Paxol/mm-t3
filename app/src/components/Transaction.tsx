import { FC } from "react";
import moment from "moment";
import { BiTrash } from "react-icons/bi";
import { TransactionWithJoins } from "@paxol/api/src/types";

function getWalletText({ wallet, walletTo }: TransactionWithJoins) {
  if (wallet && walletTo) return wallet.name + " → " + walletTo.name;
  else return wallet?.name;
}

function getColor(type: string) {
  if (type === "o") return "bg-red-400";
  if (type === "i") return "bg-green-400";

  return "bg-gray-400";
}

export const Transaction: FC<{
  element: TransactionWithJoins;
  showTrash?: boolean;
  hideTitle?: boolean;
  onElementClick?: (element: TransactionWithJoins) => void;
  onTrashClick?: (element: TransactionWithJoins) => void;
}> = ({
  element,
  onTrashClick,
  onElementClick,
  hideTitle = false,
  showTrash = false,
}) => {
  const categoryName = element.category?.name || "Transazione";
  const color = getColor(element.type);

  return (
    <div
      className="flex border-t first:border-0 last:pb-0 py-3 space-x-2 items-center dark:border-gray-700"
      onClick={() => onElementClick && onElementClick(element)}
    >
      <div className="flex flex-auto items-center">
        <div className="flex-none mr-3 mt-0.5">
          {/* Maybe category icon */}
          {/* <div className={`w-10 h-10 ${color} text-gray-800 p-1.5 rounded-2xl`}>
            <RiMoneyEuroCircleLine className="w-full h-full" />
          </div> */}
          <div className={`w-4 h-4 ${color} rounded-full`}></div>
        </div>
        <div className="flex-auto flex flex-col dark:text-white">
          {!hideTitle && (
            <span className="text-lg leading-none font-semibold mb-1">
              {categoryName}
            </span>
          )}
          {element.description && (
            <span className="text-sm leading-none font-medium text-gray-800 dark:text-gray-100 mb-1">
              {element.description}
            </span>
          )}
          <span className="text-sm leading-none text-gray-800 dark:text-gray-100 mb-2">
            {getWalletText(element)}
          </span>
          <span className="text-sm leading-none font-light text-gray-600 dark:text-gray-300">
            {moment(element.date).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      </div>
      <div
        className={`flex-none flex items-center space-x-1 ${color} py-0.5 px-2 rounded-md`}
      >
        {element.type === "o" && <ExpenseArrow />}
        {element.type === "i" && <IncomeArrow />}
        {element.type === "t" && <TransactionArrow />}
        <span className="text-white">€ {element.amount.toFixed(2)}</span>
      </div>

      {showTrash && (
        <div
          className="flex-none flex items-center p-2 m-0 cursor-pointer dark:text-white dark:hover:text-red-400 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onTrashClick && onTrashClick(element);
          }}
        >
          <BiTrash />
        </div>
      )}
    </div>
  );
};

const TransactionArrow = () => (
  <svg
    className="h-4 w-4 text-white transform rotate-45"
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M11.95 7.95l-1.414 1.414L8 6.828 8 20H6V6.828L3.465 9.364 2.05 7.95 7 3l4.95 4.95zm10 8.1L17 21l-4.95-4.95 1.414-1.414 2.537 2.536L16 4h2v13.172l2.536-2.536 1.414 1.414z"></path>
    </g>
  </svg>
);

const IncomeArrow = () => (
  <svg
    className="h-4 w-4 text-white transform rotate-180"
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M16.004 9.414l-8.607 8.607-1.414-1.414L14.589 8H7.004V6h11v11h-2V9.414z"></path>
    </g>
  </svg>
);

const ExpenseArrow = () => (
  <svg
    className="h-4 w-4 text-white"
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M16.004 9.414l-8.607 8.607-1.414-1.414L14.589 8H7.004V6h11v11h-2V9.414z"></path>
    </g>
  </svg>
);
