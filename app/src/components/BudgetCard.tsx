import React, { FC } from "react";
import type { Budget } from "@paxol/db";
import { MdOutlineEdit } from "react-icons/md";

import { Progress } from "~/components/Progress";
import { TwButton } from "~/components/TwButton";
import { Card } from "./Card";

type BudgetProps = {
  amount: number;
  type: Budget["type"];
  name: string;
  value: number;
  onEditClick?: () => void;
};
export const BudgetCard: FC<BudgetProps> = ({
  amount,
  name,
  type,
  value,
  onEditClick,
}) => {
  let typeSting: string;
  switch (type) {
    case "MONTHLY":
      typeSting = "Mensile";
      break;
    case "WEEKLY":
      typeSting = "Settimanale";
      break;

    default:
      typeSting = type;
      break;
  }

  const percentage = (value / amount) * 100;
  const color =
    percentage >= 100
      ? "bg-red-500"
      : percentage >= 75
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <Card className="p-4 dark:text-white">
      <div className="flex justify-between items-start">
        <div>
          <div>{name}</div>
          <small>{typeSting}</small>
          <div>
            {value.toFixed(2)} / {amount.toFixed(2)} €
          </div>
        </div>
        <TwButton variant="secondary" size="roundicon" onClick={onEditClick}>
          <MdOutlineEdit className="h-4 w-4" />
        </TwButton>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          className="flex-1"
          backgroundClass="dark:bg-slate-700"
          foregroundClass={color}
          value={Math.min(percentage, 100)}
        />
        <span>{Math.round(percentage)} %</span>
      </div>
    </Card>
  );
};
