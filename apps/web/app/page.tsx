"use client";
import '@tldraw/tldraw/tldraw.css';
import IconLabel from "@ui/components/icon-label";
import { GitBranchIcon, GithubIcon } from 'lucide-react';
import NextJsIcon from "@ui/icons/nextjs";

const repo = "Web-Spinner-gramliu/web-spinner";
const branch = "main"
const tech = "Next.js App Router";

export default async function IndexPage() {
  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-10">
      <h1 className="text-3xl font-bold">Web Spinner</h1>
      <section className="p-4 grid grid-cols-2 grid-rows-2 grid-flow-col">
        <IconLabel icon={<GithubIcon />} label={repo} />
        <IconLabel icon={<GitBranchIcon />} label={branch} />
        <IconLabel icon={<NextJsIcon />} label={tech} />
      </section>
    </main>
  );
}
