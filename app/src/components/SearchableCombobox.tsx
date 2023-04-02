import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Combobox } from "@headlessui/react";
import { HiSelector } from "react-icons/hi";

interface Props<T> {
  items: T[];
  selectedItem?: T;
  filter: (query: string, item: T) => boolean;
  labelMap: (item: T) => string;
  keyMap: (item: T) => string;
  onItemChange: (item: T) => void;
  noItemsFoundText: string;
}

export function SearchableCombobox<T>(props: Props<T>) {
  const {
    items,
    selectedItem,
    filter,
    labelMap,
    keyMap,
    onItemChange,
    noItemsFoundText,
  } = props;

  const [query, setQuery] = useState("");

  const [listRef] = useAutoAnimate();
  const [listContainerRef] = useAutoAnimate();

  useEffect(() => {
    if (
      !selectedItem ||
      !items.find((i) => keyMap(i) === keyMap(selectedItem))
    ) {
      onItemChange(items[0] as T);
    }
  }, [items, onItemChange, keyMap, selectedItem]);

  // Prevent search input changing from uncontrolled to controller of first render
  if (!selectedItem) return null;

  const filteredItems =
    query === ""
      ? items
      : items.filter((item) => filter(query.toLocaleLowerCase(), item));

  return (
    <Combobox
      value={selectedItem}
      onChange={(item) => {
        onItemChange(item);
      }}
    >
      <div className="relative mt-1">
        <div className="border-2 dark:border-gray-600 dark:hover:border-gray-500 hover:border-gray-300 focus-within:ring-2 ring-gray-500 w-full text-left dark:bg-gray-700 rounded-lg shadow-md cursor-default outline-transparent focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white sm:text-sm overflow-hidden">
          <Combobox.Button className="w-full flex items-center cursor-pointer">
            <Combobox.Input
              className="cursor-pointer outline-0 flex-1 border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:bg-gray-700 dark:text-white"
              onClick={(e) => {
                const txtLength = e.currentTarget.value.length;
                e.currentTarget.setSelectionRange(txtLength, txtLength);
                e.currentTarget.focus();
              }}
              onChange={(event) => setQuery(event.target.value)}
              displayValue={labelMap}
            />
            <div className="flex items-center pr-2">
              <HiSelector
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </Combobox.Button>
        </div>

        <div className="overflow-hidden">
          <div ref={listContainerRef}>
            <Combobox.Options
              ref={listRef}
              className="z-10 w-full py-1 mt-3 overflow-hidden text-base dark:bg-gray-700 dark:text-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              {filteredItems.length === 0 && query !== "" ? (
                <div className="cursor-default select-none relative py-2 px-4 text-gray-700 dark:text-white">
                  {noItemsFoundText}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const key = keyMap(item);
                  const label = labelMap(item);

                  return (
                    <Combobox.Option
                      key={key}
                      value={item}
                      className={({ active }) =>
                        `cursor-default select-none relative px-4 py-2 ${
                          active
                            ? "text-white bg-blue-600 font-medium"
                            : "text-gray-900 dark:text-white"
                        }`
                      }
                    >
                      {label}
                    </Combobox.Option>
                  );
                })
              )}
            </Combobox.Options>
          </div>
        </div>
      </div>
    </Combobox>
  );
}
