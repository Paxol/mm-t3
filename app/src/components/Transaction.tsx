import moment from "moment";
import { BiTrash } from "react-icons/bi";
import { TransactionWithJoins } from "@paxol/api/src/types";

import { cn } from "~/lib/utils";
import { Badge } from "./ui/badge";

type TransactionProps = {
  className?: string;
  element: TransactionWithJoins;
  showTrash?: boolean;
  hideCategory?: boolean;
  onElementClick?: (element: TransactionWithJoins) => void;
  onTrashClick?: (element: TransactionWithJoins) => void;
};

export function Transaction({
  className,
  element,
  onTrashClick,
  onElementClick,
  hideCategory = false,
  showTrash = false,
}: TransactionProps) {
  const color = getColor(element.type);

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 hover:bg-popover",
        className,
      )}
      onClick={() => onElementClick && onElementClick(element)}
    >
      <div className="flex items-stretch gap-3">
        <div
          style={{
            borderLeft: `0.25rem solid ${color}`,
          }}
        >
          {" "}
        </div>

        <div className="space-y-1">
          <p className="font-medium">{getTitle(element)}</p>
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            {!hideCategory && element.category && (
              <Badge variant="secondary" className="px-2 bg-white/[15%]">
                {element.category.name}
              </Badge>
            )}
            <span>{moment(element.date).format("DD/MM/YYYY HH:mm")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-between">
        <div className="text-right">
          <p className="text-lg font-bold">€ {element.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {getWalletText(element)}
          </p>
        </div>
        {showTrash && (
          <div
            className="flex-none flex items-center p-1 m-0 cursor-pointer dark:text-white dark:hover:text-red-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onTrashClick && onTrashClick(element);
            }}
          >
            <BiTrash />
          </div>
        )}
      </div>
    </div>
  );
}

function getWalletText({ wallet, walletTo }: TransactionWithJoins) {
  if (wallet && walletTo) return wallet.name + " → " + walletTo.name;
  else return wallet?.name;
}

function getColor(type: string) {
  if (type === "o") return "oklch(70.4% 0.191 22.216)";
  if (type === "i") return "oklch(76.5% 0.177 163.223)";

  return "oklch(70.5% 0.015 286.067)";
}

function getTitle(element: TransactionWithJoins) {
  if (element.description && element.description.length > 0)
    return element.description;

  if (element.category) return element.category.name;

  return "Transazione";
}
