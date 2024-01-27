import { TransactionWithJoins } from "@paxol/api/src/types";
import { Category } from "@paxol/db";

export type CategoryWithTransactions = {
  id: string;
  name: string;
  value: number;
  atBalance: boolean | null;
  transactions: TransactionWithJoins[];
};

export function groupTransacionsByCategory(
  transactions: TransactionWithJoins[] | undefined,
  categories: Category[] | undefined,
) {
  if (!transactions || !categories) return { in: [], out: [] };

  const inCategories: CategoryWithTransactions[] = [];
  const outCategories: CategoryWithTransactions[] = [];

  transactions.forEach((t) => {
    const category = categories.find((c) => c.id == t.categoryId);
    if (!category) return;

    const categoryArray = category.type === "in" ? inCategories : outCategories;
    const categoryWithTx = categoryArray.find((c) => c.id === t.categoryId);

    if (categoryWithTx) {
      categoryWithTx.value += Number(t.amount);
      categoryWithTx.transactions.push(t);
    } else {
      categoryArray.push({
        id: category.id,
        name: category.name,
        atBalance: category.atBalance,
        value: Number(t.amount),
        transactions: [t],
      });
    }
  });

  const sorterFunction = (
    a: CategoryWithTransactions,
    b: CategoryWithTransactions,
  ) => {
    if (a.value > b.value) return -1;
    else if (a.value < b.value) return 1;

    if (a.name > b.name) return -1;
    else if (a.name < b.name) return 1;

    return 0;
  };

  inCategories.sort(sorterFunction);
  outCategories.sort(sorterFunction);

  return {
    in: inCategories,
    out: outCategories,
  };
}
