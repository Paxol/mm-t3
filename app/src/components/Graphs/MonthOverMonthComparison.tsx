import React, { PropsWithChildren, Suspense, useMemo, useState } from "react";
import dayjs from "dayjs";
import Datepicker from "react-tailwindcss-datepicker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { Category } from "@paxol/db";

import { api } from "~/utils/api";
import { Card } from "~/components/Card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/tw-select";
import { MultiSelect } from "../ui/multiselect";

type TransactionType = "in" | "out";

interface MonthOverMonthComparisonProps {
  categories: Category[];
}

export const MonthOverMonthComparison: React.FC<
  MonthOverMonthComparisonProps
> = ({ categories }) => {
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(2, "months").startOf("month").toDate(),
    endDate: dayjs().endOf("day").toDate(),
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>();
  const [transactionType, setTransactionType] =
    useState<TransactionType>("out");

  const selectableCategories = useMemo(() => {
    if (!categories) return [];

    return categories.filter((category) => category.type === transactionType);
  }, [categories, transactionType]);

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Month-over-Month Comparison
          </h3>

          <div className="w-[280px]"></div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <small className="text-black dark:text-white">Periodo</small>
          <Datepicker
            value={dateRange}
            onChange={(value) => {
              if (value && value.startDate && value.endDate) {
                setDateRange({
                  startDate: new Date(value.startDate),
                  endDate: new Date(value.endDate),
                });
              }
            }}
            useRange={false}
            showShortcuts={true}
            configs={{
              shortcuts: {
                currentMonth: "Questo mese",
                past3Month: {
                  text: "Ultimi 3 mesi",
                  period: {
                    start: dayjs()
                      .subtract(2, "months")
                      .startOf("month")
                      .toDate(),
                    end: dayjs().endOf("day").toDate(),
                  },
                },
                past6Month: {
                  text: "Ultimi 6 mesi",
                  period: {
                    start: dayjs()
                      .subtract(5, "months")
                      .startOf("month")
                      .toDate(),
                    end: dayjs().endOf("day").toDate(),
                  },
                },
                thisYear: {
                  text: "Quest'anno",
                  period: {
                    start: dayjs().startOf("year").toDate(),
                    end: dayjs().endOf("day").toDate(),
                  },
                },
                lastYear: {
                  text: "L'anno scorso",
                  period: {
                    start: dayjs().subtract(1, "year").startOf("year").toDate(),
                    end: dayjs().subtract(1, "year").endOf("year").toDate(),
                  },
                },
              },
            }}
          />

          <small className="text-black dark:text-white">Tipologia</small>
          <Select
            value={transactionType}
            onValueChange={(value) => {
              setTransactionType(value as TransactionType);
              setSelectedCategories(undefined);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona una tipologia" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tipologie</SelectLabel>
                <SelectItem value="out">Uscite</SelectItem>
                <SelectItem value="in">Entrate</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <small className="text-black dark:text-white">Categorie</small>
          <MultiSelect
            options={selectableCategories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
            selected={selectedCategories ?? []}
            onChange={(selected) => setSelectedCategories(selected)}
            placeholder="Filtra categoria..."
            maxBadges={3}
            modalPopover
          />
        </div>

        <Suspense
          fallback={
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          }
        >
          <MonthOverMonthComparisonCardContent
            categoryIds={selectedCategories}
            transactionType={transactionType}
            dateRange={dateRange}
          />
        </Suspense>
      </div>
    </Card>
  );
};

function MonthOverMonthComparisonCardContent({
  categoryIds,
  transactionType,
  dateRange,
}: {
  categoryIds?: string[];
  transactionType: TransactionType;
  dateRange: { startDate: Date; endDate: Date };
}) {
  const { data: monthlyData } = api.transactions.getMonthlyComparison.useQuery(
    {
      from: dateRange.startDate.toISOString(),
      to: dateRange.endDate.toISOString(),
      categoryIds,
      type: transactionType,
    },
    { suspense: true },
  );

  const chartData = useMemo(() => {
    if (!monthlyData) return [];

    return monthlyData.map((data) => ({
      month: data.monthName,
      total: data.total,
      transactionCount: data.transactionCount,
    }));
  }, [monthlyData]);

  const comparisonMetrics = useMemo(() => {
    if (!monthlyData || monthlyData.length < 2) return null;

    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    if (!current || !previous) return null;

    const change = current.total - previous.total;
    const changePercent =
      previous.total > 0 ? (change / previous.total) * 100 : 0;

    return {
      currentMonth: current.monthName,
      previousMonth: previous.monthName,
      currentTotal: current.total,
      previousTotal: previous.total,
      change,
      changePercent,
    };
  }, [monthlyData]);

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <>
      {/* Chart */}
      <MonthOverMonthChart
        noContent={
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Nessun dato disponibile per il periodo e categoria selezionati.
            </p>
          </div>
        }
        fill={transactionType == "out" ? "#f87171" : "#4ade80"}
        chartData={chartData}
        formatCurrency={formatCurrency}
      >
        {/* Comparison Summary */}
        {comparisonMetrics && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Comparison Summary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Current Month
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(comparisonMetrics.currentTotal)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Previous Month
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(comparisonMetrics.previousTotal)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Change</p>
                <p
                  className={`font-medium ${
                    comparisonMetrics.change >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {comparisonMetrics.change >= 0 ? "+" : ""}
                  {formatCurrency(comparisonMetrics.change)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Change %</p>
                <p
                  className={`font-medium ${
                    comparisonMetrics.changePercent >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {comparisonMetrics.changePercent >= 0 ? "+" : ""}
                  {comparisonMetrics.changePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </MonthOverMonthChart>
    </>
  );
}

type MonthOverMonthChartProps = {
  noContent?: React.ReactNode;
  fill: string;
  formatCurrency: (value: number) => string;
  chartData: {
    month: string;
    total: number;
    transactionCount: number;
  }[];
};

function MonthOverMonthChart({
  noContent,
  chartData,
  fill,
  formatCurrency,
  children,
}: PropsWithChildren<MonthOverMonthChartProps>) {
  let hasData = false;
  for (const data of chartData) {
    if (data.total > 0) {
      hasData = true;
      break;
    }
  }

  if (!hasData) return <>{noContent}</>;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total: {formatCurrency(data.total)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Transactions: {data.transactionCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill={fill} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {children}
    </>
  );
}
