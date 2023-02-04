import { FC, PropsWithChildren, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Category } from "@prisma/client";
import moment from "moment";
import { signIn, useSession } from "next-auth/react";
import { RiMoneyEuroCircleLine } from "react-icons/ri";

import { api } from "~/utils/api";
import { PageLayout } from "~/components/PageLayout";

const LoginPage = () => (
  <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
    <h1 className="text-5xl md:text-[5rem] leading-normal font-extrabold text-gray-300">
      UMoney
    </h1>
    <span className="text-3xl md:text-[2rem] leading-normal font-bold text-gray-300 text-center">
      Traccia le tue finanze
    </span>

    <div className="grid gap-3 pt-3 mt-3 text-center lg:w-1/3">
      <button
        className="text-center p-6 duration-500 border-2 border-gray-500 text-lg text-gray-300 rounded shadow-xl motion-safe:hover:scale-105"
        onClick={() => signIn("google")}
      >
        Login with Google
      </button>
    </div>
  </main>
);

const Home: NextPage = () => {
  const { data } = useSession();

  return (
    <>
      <Head>
        <title>UMoney - Traccia le tue finanze</title>
        <meta name="description" content="UMoney - Traccia le tue finanze" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-gray-700">
        {!data ? (
          <LoginPage />
        ) : (
          <PageLayout name="Dashboard">
            <DashboardPage />
          </PageLayout>
        )}
      </div>
    </>
  );
};

export default Home;

const DashboardPage = () => {
  const { isLoading, data, error } = api.dashboard.data.useQuery();
  const [firstRowContainer] = useAutoAnimate<HTMLDivElement>();

  if (error) {
    console.log(error);
    return <div role="status">Si è verificato un errore</div>;
  }

  const showCategoriesCards = isLoading || (data?.Transactions.length || 0) > 0;

  return (
    <>
      <div
        ref={firstRowContainer}
        className="flex flex-col lg:flex-row lg:space-x-4"
      >
        <Resume />
        {showCategoriesCards && (
          <div className="flex flex-4 flex-col sm:flex-row lg:flex-col xl:space-x-4 sm:space-x-4 lg:space-x-0 xl:flex-row xl:flex-6">
            <Categories type="in" />
            <Categories type="out" />
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        {/* <CardGrafico transazioni={transazioni} conti={wallets} /> */}

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 lg:flex-3">
          {/* <CardTransazioni transazioni={transazioniDaMostrare} conti={wallets} categorie={categories} /> */}

          <LatestTransactions />
        </div>
      </div>
    </>
  );
};

const Resume = () => {
  const ctx = api.useContext();
  const data = ctx.dashboard.data.getData();
  const [infoContainer] = useAutoAnimate<HTMLDivElement>();

  const [earnings, expenses] = useMemo(() => {
    let earnings = 0;
    let expenses = 0;

    data?.Transactions.forEach((item) => {
      if (moment(item.date).isBefore(moment().startOf("month"))) return;

      switch (item.type) {
        case "i":
          earnings += item.amount;
          break;
        case "o":
          expenses += item.amount;
          break;
      }
    });

    return [earnings, expenses];
  }, [data]);

  const [cash, savings] = useMemo(() => {
    let cash = 0;
    let savings = 0;

    data?.Wallets.forEach((item) => {
      switch (item.type) {
        case 0:
          cash += item.currentValue;
          break;
        case 1:
          savings += item.currentValue;
          break;
      }
    });

    return [cash, savings];
  }, [data]);

  const isLoading = data === undefined;
  const hasWallets = (data?.Wallets.length || 0) > 0;

  const showNoWalletMessage = !isLoading && !hasWallets;

  return (
    <Card className="flex-8 w-full mb-4 text-center sm:flex-row sm:space-x-6 sm:text-left lg:px-8 lg:space-x-16 xl:px-12 xl:space-x-24">
      <div
        ref={infoContainer}
        className={showNoWalletMessage ? "flex-auto" : ""}
      >
        <span className="text-xl text-gray-400">Bilancio</span>
        {!showNoWalletMessage && (
          <>
            <div className="flex flex-col flex-none space-y-5 mt-5 justify-center self-center">
              {data ? (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">
                    € {cash.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-400 mb-3">
                    in liquidità
                  </span>
                  <span className="text-xl font-bold text-white">
                    € {savings.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-400">
                    in investimenti
                  </span>
                </div>
              ) : (
                <div className="flex flex-col animate-pulse">
                  <span className="text-3xl rounded-xl bg-gray-700 w-32">
                    &nbsp;
                  </span>
                  <span className="text-sm font-medium text-gray-400 mb-3">
                    in liquidità
                  </span>
                  <span className="text-xl rounded-md bg-gray-700 w-24">
                    &nbsp;
                  </span>
                  <span className="text-sm font-medium text-gray-400">
                    in investimenti
                  </span>
                </div>
              )}

              <div className="flex space-x-8 flex-none">
                {/* Entrate */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 animate-pulse">
                    <svg
                      className="flex-none text-green-500"
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"></path>
                    </svg>
                    {data ? (
                      <span className="flex-auto font-medium text-white">
                        € {earnings.toFixed(2)}
                      </span>
                    ) : (
                      <span className="flex-auto rounded-md bg-gray-700 w-16">
                        &nbsp;
                      </span>
                    )}
                  </div>
                  <span className="font-light whitespace-nowrap text-gray-500">
                    Entrate del mese
                  </span>
                </div>

                {/* Uscite */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 animate-pulse">
                    <svg
                      className="flex-none text-red-500"
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"></path>
                    </svg>
                    {data ? (
                      <span className="flex-auto font-medium text-white">
                        € {expenses.toFixed(2)}
                      </span>
                    ) : (
                      <span className="flex-auto rounded-md bg-gray-700 w-16">
                        &nbsp;
                      </span>
                    )}
                  </div>
                  <span className="font-light whitespace-nowrap text-gray-500">
                    Uscite del mese
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {showNoWalletMessage && (
          <p className="my-5 dark:text-white">Non hai registrato conti</p>
        )}
      </div>

      {!showNoWalletMessage && (
        <div className="flex flex-col justify-center mt-2 pt-2 sm:mt-0 sm:p-0 w-full">
          {data ? (
            <>
              <span className="text-md text-gray-300 mb-1">Conti</span>

              <div className="mb-1">
                {data?.Wallets.filter((w) => w.type === 0).map((w) => (
                  <div
                    key={w.id}
                    className="select-none inline-flex flex-col bg-gray-700 text-white rounded-md py-2 px-4 mr-1 mb-1"
                  >
                    <span className="font-medium">{w.name}</span>€{" "}
                    {w.currentValue.toFixed(2)}
                  </div>
                ))}
              </div>

              <span className="text-md text-gray-300 mb-1">Investimenti</span>
              <div className="">
                {data?.Wallets.filter((w) => w.type === 1).map((w) => (
                  <div
                    key={w.id}
                    className="select-none inline-flex flex-col bg-gray-700 text-white rounded-md py-2 px-4 mr-1 mb-1"
                  >
                    <span className="font-medium">{w.name}</span>€{" "}
                    {w.currentValue.toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div
                className="rounded-xl bg-gray-700 h-full"
                style={{ minHeight: "204px" }}
              >
                &nbsp;
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const Categories: FC<{ type?: "in" | "out" }> = ({ type = "in" }) => {
  const ctx = api.useContext();
  const data = ctx.dashboard.data.getData();

  const categories = useMemo(() => {
    const categoriesMap = new Map<
      string,
      {
        category: Category;
        amount: number;
      }
    >();

    if (data) {
      data.Transactions.forEach((t) => {
        if (!t.category || t.category.type !== type) return;

        if (categoriesMap.has(t.category.id.toString())) {
          const val = categoriesMap.get(t.category.id.toString());
          if (!val) return;

          val.amount += t.amount;

          categoriesMap.set(t.category.id.toString(), val);
        } else {
          categoriesMap.set(t.category.id.toString(), {
            category: t.category,
            amount: t.amount,
          });
        }
      });
    }

    return [...categoriesMap.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [data, type]);

  return (
    <Card className="flex-3 mb-4">
      <div className="flex flex-none justify-between items-center mb-3">
        <span className="text-lg font-medium dark:text-white">
          {type === "in" ? "Entrate" : "Uscite"}
        </span>
      </div>

      <div className="flex-auto flex flex-col justify-center">
        {categories.map(({ category: { id, type, name }, amount }) => (
          <div
            key={id}
            className="flex border-b py-3 space-x-3 items-center last:border-b-0 dark:border-gray-700"
          >
            <div className="flex-none">
              <div
                className={`w-10 h-10 ${
                  type === "in" ? "bg-green-400" : "bg-red-400"
                } text-gray-800 p-1.5 rounded-2xl`}
              >
                <RiMoneyEuroCircleLine className="w-full h-full" />
              </div>
            </div>
            <div className="flex-auto flex flex-col dark:text-white">
              <span className="text-lg leading-none font-medium mb-1">
                {name}
              </span>
              <span className="text-sm leading-none text-gray-800 dark:text-gray-100">
                € {amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const LatestTransactions: FC = () => {
  // const query = api.dashboard.latestTransactions.useQuery();

  return null;
};

const Card: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  let myClass = "bg-gray-800 flex flex-col p-4 rounded-md shadow-md";

  if (className) myClass = `${myClass} ${className}`;

  return <div className={myClass}>{children}</div>;
};
