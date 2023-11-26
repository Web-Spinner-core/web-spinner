"use client";
import "@tldraw/tldraw/tldraw.css";
import IconLabel from "@ui/components/icon-label";
import { GitBranchIcon, GithubIcon } from "lucide-react";
import NextJsIcon from "@ui/icons/nextjs";
import { Tldraw } from "@tldraw/tldraw";
import clsx from "clsx";

const repo = "Web-Spinner-gramliu/web-spinner";
const branch = "main";
const tech = "Next.js App Router";

export default async function IndexPage() {
  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-10">
      <h1 className="text-3xl font-bold">Web Spinner</h1>
      {/* Headers */}
      <section className="p-4 grid grid-cols-2 grid-rows-2 grid-flow-col">
        <IconLabel icon={<GithubIcon />} label={repo} />
        <IconLabel icon={<GitBranchIcon />} label={branch} />
        <IconLabel icon={<NextJsIcon />} label={tech} />
      </section>
      {/* Panels */}
      <section className="p-4 grid grid-cols-2 items-center justify-center">
        {/* Editor */}
        <div className="h-[70vh] w-[40vw] self-center justify-self-center bg-gray-100 rounded-md">
          <Tldraw />
        </div>
        {/* Output */}
        <div
          className={clsx(
            "h-[70vh] w-[40vw] self-center justify-self-center bg-gray-100 rounded-md",
            "flex items-center justify-center"
          )}
        >
          <p className="font-mono text-lg">Placeholder for rendered output</p>
        </div>
      </section>
    </main>
  );
}
