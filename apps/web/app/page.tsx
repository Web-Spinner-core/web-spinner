"use client";
import "@tldraw/tldraw/tldraw.css";
import { Toaster } from "@ui/components";
import Header from "~/components/header";

export default function IndexPage() {
  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-5">
      <Header>
        <h1 className="text-2xl font-bold">Projects</h1>
      </Header>
      <section className="p-4 grid grid-cols-2 items-start justify-center"></section>
      <Toaster />
    </main>
  );
}
