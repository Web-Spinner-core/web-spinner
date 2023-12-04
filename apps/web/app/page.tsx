"use client";
import { useUser } from "@clerk/nextjs";
import "@tldraw/tldraw/tldraw.css";
import { Avatar, AvatarFallback, AvatarImage, Toaster } from "@ui/components";
import HomeIcon from "~/components/home-icon";

function getInitials(firstName: string, lastName: string) {
  return firstName.charAt(0) + lastName.charAt(0);
}

export default function IndexPage() {
  const { user } = useUser();

  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-5">
      <header className="flex flex-row justify-between w-full mb-5 items-center z-10 px-5">
        <div className="flex flex-row gap-4 items-center">
          <HomeIcon />
          <h1 className="text-2xl font-bold">Projects</h1>
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
      <section className="p-4 grid grid-cols-2 items-start justify-center"></section>
      <Toaster />
    </main>
  );
}
