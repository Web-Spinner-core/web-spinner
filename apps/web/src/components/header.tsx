"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components";
import HomeIcon from "./home-icon";
import { useUser } from "@clerk/nextjs";
import React from "react";

function getInitials(firstName: string, lastName: string) {
  return firstName.charAt(0) + lastName.charAt(0);
}

interface Props {
  children?: JSX.Element | JSX.Element[];
}

/**
 * Header component showed at the top of the layout
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
        <Avatar>
          <AvatarImage src={user?.imageUrl} alt={user?.fullName} />
          <AvatarFallback>
            {user != null ? getInitials(user.firstName, user.lastName) : ""}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
