import React, { FC, Suspense, useEffect, useMemo, useState } from "react";
import { atom, useAtomValue } from "jotai";
import moment from "moment";
import { Budget, Category } from "@paxol/db";

import { api } from "~/utils/api";
import { Dialog, DialogTitle } from "~/components/Dialog";
import { Loader } from "~/components/Loader";
import { TwButton } from "~/components/TwButton";
import { MontlyGraph } from "~/components/BudgetDialogs/MontlyGraph";

type BudgetWithCategory = Budget & {
  category: Category;
};

export const ShowBudgetDetailsAtom = atom<BudgetWithCategory | null>(null);

export const BudgetDetailsDialog: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const item = useAtomValue(ShowBudgetDetailsAtom);

  const [periodOffset, setPeriodOffset] = useState(-1);
  const [start, middle, end] = useMemo(() => {
    if (!item) return [moment().startOf("week").add(-1, "week"), moment().startOf("week"), moment().endOf("week")];

    const period = item.type === "MONTHLY" ? "month" : "week";

    const start = moment().startOf(period).add(periodOffset - 1, period).startOf(period);
    const middle = moment().startOf(period).add(periodOffset, period).startOf(period);
    const end = moment().endOf(period).add(periodOffset, period).endOf(period);

    return [start, middle, end];
  }, [item, periodOffset]);

  useEffect(() => {
    if (item) setIsOpen(true);
  }, [item]);

  useEffect(() => {
    setPeriodOffset(0);
  }, [item?.id]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogTitle
        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
        as="h3"
      >
        Dettagli budget: {item.category.name}
      </DialogTitle>

      <Suspense fallback={<Loader className="mt-16" />}>
        <BudgetDetailsContent item={item} start={start} middle={middle} end={end} budget={item.amount} onPreviousClick={() => setPeriodOffset(prev => prev - 1)} onNextClick={() => setPeriodOffset(prev => prev + 1)} />
      </Suspense>
    </Dialog>
  );
};

function BudgetDetailsContent(props: {
  item: BudgetWithCategory;
  start: moment.Moment;
  middle: moment.Moment;
  end: moment.Moment;
  budget: number;

  onPreviousClick: () => void;
  onNextClick: () => void;
}) {
  const { data } = api.transactions.getRange.useQuery(
    {
      categories: [props.item.category.id],
      from: props.start.toISOString(),
      to: props.end.toISOString(),
    },
    { suspense: true },
  );

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <MontlyGraph data={data} start={props.start} middle={props.middle} end={props.end} budget={props.budget} />
      </div>

      <div className="flex justify-between items-center">
        <TwButton onClick={props.onPreviousClick}>{"<-"}</TwButton>
        <span>{props.start.format("DD/MM")} - {props.end.format("DD/MM")}</span>
        <TwButton onClick={props.onNextClick}>{"->"}</TwButton>
      </div>
    </div>
  );
}
