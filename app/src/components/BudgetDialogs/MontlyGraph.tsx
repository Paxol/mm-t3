import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { TransactionWithJoins } from "@paxol/api/src/types";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

export function MontlyGraph(props: {
  data: TransactionWithJoins[];
  start: moment.Moment;
  middle: moment.Moment;
  end: moment.Moment;
  budget: number;
}) {
  const data = useChartData(props);

  return (
    <ChartContainer
      config={{
        current: {
          label: "Current",
          color: "#fb2c36",
        },
        budget: {
          label: "Budget",
          color: "#2eb88a",
        },
        previous: {
          label: "Previous",
          color: "#e88c30",
        },
      }}
      className="min-h-[350px] w-full"
    >
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          // tickMargin={8}
          tickFormatter={(value) => `${value}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          // tickMargin={8}
          tickFormatter={(value) => `€${value}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />

        {/* Current month expenses (solid line) */}
        <Line
          type="monotone"
          dataKey="current"
          stroke="#fb2c36"
          strokeWidth={2}
          dot={false}
          // dot={{ r: 4 }}
          // activeDot={{ r: 6 }}
        />

        {/* Budget line (dotted) */}
        <Line
          type="monotone"
          dataKey="budget"
          stroke="#2eb88a"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />

        {/* Previous month expenses (dotted) */}
        <Line
          type="monotone"
          dataKey="previous"
          stroke="#e88c30"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function useChartData(props: {
  data: TransactionWithJoins[];
  start: moment.Moment;
  middle: moment.Moment;
  end: moment.Moment;
  budget: number;
}) {
  const data = useMemo(() => {
    const firstPeriodDays = props.middle.diff(props.start, "days");
    const lastPeriodDays = props.end.diff(props.middle, "days");

    const days = Math.max(firstPeriodDays, lastPeriodDays);

    const firstPeriodTransactions = props.data.filter((t) =>
      props.middle.isAfter(t.date),
    );
    const lastPeriodTransactions = props.data.filter((t) =>
      props.middle.isSameOrBefore(t.date),
    );

    const data = [] as {
      day: number;
      previous: number;
      current: number;
      budget: number;
    }[];

    for (let i = 0; i < days; i++) {
      const dateFirst = props.start.clone().add(i, "days");
      const dateLast = props.middle.clone().add(i, "days");
      let firstPeriodTransactionAmount = firstPeriodTransactions
        .filter((t) => dateFirst.isSame(t.date, "day"))
        .reduce((a, b) => a + b.amount, 0);
      let lastPeriodTransactionAmount = lastPeriodTransactions
        .filter((t) => dateLast.isSame(t.date, "day"))
        .reduce((a, b) => a + b.amount, 0);

      if (i > 0) {
        firstPeriodTransactionAmount += data.at(i - 1)?.previous ?? 0;
        lastPeriodTransactionAmount += data.at(i - 1)?.current ?? 0;
      }

      data.push({
        day: i + 1,
        previous: firstPeriodTransactionAmount,
        current: lastPeriodTransactionAmount,
        budget: props.budget,
      });
    }

    return data;
  }, [props.data, props.start, props.middle, props.end, props.budget]);

  return data;
}
