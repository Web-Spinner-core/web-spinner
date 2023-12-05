"use client";
import { useUser } from "@clerk/nextjs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components";
import { CheckIcon, ChevronsUpDownIcon, User } from "lucide-react";
import HomeIcon from "./home-icon";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";

function getInitials(firstName: string, lastName: string) {
  return firstName.charAt(0) + lastName.charAt(0);
}

interface HeaderProps {
  children?: JSX.Element | JSX.Element[];
}

/**
 * Header component showed at the top of  the layout
 */
export default function Header({ children }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="flex flex-row justify-between w-full mb-5 items-center z-10 px-5">
      <div className="flex flex-row gap-4 items-center">
        <HomeIcon />
        {children}
      </div>
      <div className="flex flex-row">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName} />
              <AvatarFallback>
                {user != null ? getInitials(user.firstName, user.lastName) : ""}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mr-5">
            <DropdownMenuLabel>
              {user?.fullName ?? "My Profile"}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="font-light pt-0">
              {user?.primaryEmailAddress.emailAddress ?? ""}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface TitledHeaderProps extends HeaderProps {
  title: string;
  options?: {
    value: string;
    label: string;
  }[];
  optionsPlaceholder?: string;
  selectedOption?: string;
}

/**
 * Header component with a title and potential options
 */
export function TitledHeader({
  title,
  options,
  optionsPlaceholder,
  selectedOption,
}: TitledHeaderProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const router = useRouter();

  return (
    <div className="flex flex-row gap-4 items-center">
      <HomeIcon />
      <h1 className="text-2xl font-bold">{title}</h1>
      {options && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger>
            <ChevronsUpDownIcon />
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder="Search for project" />
              <CommandEmpty>
                {optionsPlaceholder ?? "No options found"}
              </CommandEmpty>
              <CommandGroup>
                {options.map(({ value, label }) => (
                  <CommandItem
                    key={value}
                    value={value}
                    onSelect={(value) => {
                      setPopoverOpen(false);
                      router.push(`/projects/${value}/canvas`);
                    }}
                  >
                    <CheckIcon
                      className={clsx(
                        "mr-2",
                        selectedOption === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
