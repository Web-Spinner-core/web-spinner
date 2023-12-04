"use client";
import { useUser } from "@clerk/nextjs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@ui/components";
import { User } from "lucide-react";
import HomeIcon from "./home-icon";

function getInitials(firstName: string, lastName: string) {
  return firstName.charAt(0) + lastName.charAt(0);
}

interface Props {
  children?: JSX.Element | JSX.Element[];
}

/**
 * Header component showed at the top of  the layout
 */
export default function Header({ children }: Props) {
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
            <DropdownMenuLabel className="font-light pt-0">{user?.primaryEmailAddress.emailAddress ?? ""}</DropdownMenuLabel>
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
