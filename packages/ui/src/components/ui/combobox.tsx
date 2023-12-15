"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@ui/components/ui";
import { ChevronsUpDown, Check } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@ui/lib/utils";
import { Button } from "./button";

interface Props {
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
  selectedOption?: string;
  onOptionSelected?: (value: string) => void;
}

/**
 * A Combobox is a dropdown that allows the user to select an option from a list of options.
 */
export default function ComboBox({
  options,
  placeholder,
  selectedOption,
  onOptionSelected,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedOption);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[500px] justify-between self-end"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-2 z-10 cursor-pointer drop-shadow">
        <Command>
          <CommandInput placeholder={placeholder ?? "Search..."} />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                className="cursor-pointer"
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  setOpen(false);
                  if (onOptionSelected) {
                    onOptionSelected(currentValue);
                  }
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
