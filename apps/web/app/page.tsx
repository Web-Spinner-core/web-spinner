"use client";
import { Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Button, Skeleton } from "@ui/components";
import Canvas from "@ui/components/canvas";
import IconLabel from "@ui/components/icon-label";
import NextJsIcon from "@ui/icons/nextjs";
import clsx from "clsx";
import { GitBranchIcon, GithubIcon } from "lucide-react";
import { useState } from "react";
import { convertEditorToCode } from "~/lib/editorToCode";

const repo = "Web-Spinner-gramliu/web-spinner";
const branch = "main";
const tech = "Next.js App Router";

/**
 * Loading placeholder for rendered output
 */
function SkeletonPlaceholder() {
  return (
    <div className="h-full w-full flex justify-center items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-gray-300" />
        <Skeleton className="h-4 w-[200px] bg-gray-300" />
      </div>
    </div>
  );
}

export default async function IndexPage() {
  const [editor, setEditor] = useState<Editor>();
  const [output, setOutput] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

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
          <Canvas setEditor={setEditor} />
        </div>
        {/* Output */}
        <div
          className={clsx(
            "h-[70vh] w-[40vw] self-center justify-self-center bg-gray-100 rounded-md",
            "flex items-center justify-center"
          )}
        >
          {loading ? (
            <SkeletonPlaceholder />
          ) : (
            <iframe className="h-full w-full" srcDoc={output} />
          )}
        </div>
      </section>
      <div className="flex flex-row items-center justify-center mt-10">
        <Button
          className="w-32"
          disabled={editor == null || loading}
          onClick={async () => {
            setLoading(true);
            setOutput("");
            try {
              if (editor) {
                const result = await convertEditorToCode(editor);
                setOutput(result);
              } else {
                console.error(
                  "Tried to convert editor to code, but editor is not ready yet."
                );
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          ✨ Generate
        </Button>
      </div>
    </main>
  );
}
