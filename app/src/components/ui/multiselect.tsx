import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxBadges?: number;
  modalPopover?: boolean;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  maxBadges = 3,
  modalPopover = false,
  disabled = false,
}: MultiSelectProps) {
  const [search, setSearch] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement;
    if (input.value === "") {
      if (e.key === "Backspace") {
        onChange(selected.slice(0, -1));
      }
    }
  };

  const selectables = options.filter(
    (option) => !selected.includes(option.value),
  );

  return (
    <Popover modal={modalPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "dark:bg-input/30 dark:hover:bg-input/50 w-full h-auto pl-2 pr-4 justify-between text-left font-normal",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap -mb-0.5">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.length > 0 && (
              <>
                {selected.slice(0, maxBadges).map((item) => {
                  const option = options.find(
                    (option) => option.value === item,
                  );
                  const IconComponent = option?.icon;
                  return (
                    <Badge
                      variant="secondary"
                      key={item}
                      className="mr-1 mb-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      {IconComponent && (
                        <IconComponent className="h-4 w-4 mr-2" />
                      )}
                      {option?.label}
                      <button
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(item);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  );
                })}
                {selected.length > maxBadges && (
                  <Badge variant="secondary" className="mr-1 mb-1">
                    +{selected.length - maxBadges} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {selected.length > 0 && (
              <CommandGroup>
                <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">Selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange([])}
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                </div>
                {selected.map((item) => {
                  const option = options.find(
                    (option) => option.value === item,
                  );
                  const IconComponent = option?.icon;
                  return (
                    <CommandItem
                      key={item}
                      onSelect={() => handleUnselect(item)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {IconComponent && (
                        <IconComponent className="mr-2 h-4 w-4" />
                      )}
                      {option?.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            <CommandGroup>
              {selectables.map((option) => {
                const IconComponent = option.icon;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onChange([...selected, option.value]);
                      setSearch("");
                    }}
                  >
                    {IconComponent && (
                      <IconComponent className="mr-2 h-4 w-4" />
                    )}
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
