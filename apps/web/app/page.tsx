"use client";
import { Editor, TLPageId } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import {
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  useToast,
} from "@ui/components";
import Canvas from "@ui/components/canvas";
import IconLabel from "@ui/components/icon-label";
import NextJsIcon from "@ui/icons/nextjs";
import clsx from "clsx";
import { GitBranchIcon, GithubIcon } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { CopyBlock, nord } from "react-code-blocks";
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

interface ReducerState {
  [key: string]: string;
}

interface ReducerAction {
  type: "add_page";
  pageId: string;
  code: string;
}

function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  if (action.type === "add_page") {
    return {
      ...state,
      [action.pageId]: action.code,
    };
  }
  return state;
}

export default function IndexPage() {
  const [editor, setEditor] = useState<Editor>();
  const [standaloneCode, setStandaloneCode] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const [pageId, setPageId] = useState<TLPageId>();
  const [page, setPage] = useState<string>("");

  const [state, dispatch] = useReducer(reducer, {} as ReducerState);

  // Update page ID to trigger secondary effect
  useEffect(() => {
    if (editor != null) {
      setPageId(editor.getCurrentPageId());
    }
  }, [editor]);

  // Update page name in output pane
  useEffect(() => {
    if (pageId != null && editor != null) {
      const page = editor.getPage(pageId);
      if (page != null) {
        setPage(page.name);
        setStandaloneCode(state[pageId] ?? "");
      }
    }
  }, [pageId, editor]);

  const sectionWidth = "w-[45vw]";

  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-10">
      <h1 className="text-3xl font-bold mb-5">Web Spinner</h1>
      {/* Headers */}
      <section className="p-4 grid grid-cols-2 items-center justify-center">
        <div
          className={clsx(
            sectionWidth,
            "flex flex-col justify-self-center items-start gap-2"
          )}
        >
          <IconLabel icon={<GithubIcon />} label={repo} />
          <IconLabel icon={<GitBranchIcon />} label={branch} />
        </div>
        <div
          className={clsx(
            sectionWidth,
            "flex flex-col justify-self-center items-start gap-2"
          )}
        >
          <IconLabel icon={<NextJsIcon />} label={tech} />
        </div>
      </section>
      {/* Panels */}
      <section className="p-4 grid grid-cols-2 items-center justify-center">
        {/* Editor */}
        <div
          className={clsx(
            sectionWidth,
            "h-[70vh]",
            "self-center justify-self-center bg-gray-100 rounded-md"
          )}
        >
          <Canvas
            setEditor={setEditor}
            onPageChanged={(newPageId) => {
              setPageId(newPageId);
            }}
          />
        </div>
        {/* Output */}
        <div
          className={clsx(
            sectionWidth,
            "h-[70vh]",
            "justify-self-center bg-gray-100 rounded-md",
            "flex items-start justify-center"
          )}
        >
          <Tabs
            defaultValue="preview"
            className="w-full h-full grid grid-rows-[auto_1fr]"
          >
            <TabsList className="justify-between">
              <div className="pl-4">{page}</div>
              <div>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code_standalone">
                  Code (Standalone)
                </TabsTrigger>
              </div>
            </TabsList>
            {loading ? (
              <SkeletonPlaceholder />
            ) : (
              <>
                <TabsContent value="preview" className="h-full">
                  <iframe className="h-full w-full" srcDoc={standaloneCode} />
                </TabsContent>
                <TabsContent
                  value="code_standalone"
                  className="h-full overflow-x-auto overflow-y-auto"
                >
                  {standaloneCode?.length && (
                    <CopyBlock
                      codeBlock
                      text={standaloneCode}
                      language="html"
                      theme={nord}
                      showLineNumbers
                      customStyle={{
                        fontFamily: "var(--font-mono)",
                        overflowX: "auto",
                        overflowY: "auto",
                      }}
                    />
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>
      {/* Button */}
      <div className="flex flex-row items-center justify-center mt-10">
        <Button
          className="w-32"
          disabled={editor == null || loading}
          onClick={async () => {
            setLoading(true);
            setStandaloneCode("");
            try {
              if (editor) {
                const result = await convertEditorToCode(editor);
                setStandaloneCode(result);
                dispatch({ type: "add_page", pageId, code: result });
              } else {
                throw new Error("Editor is not ready yet!");
              }
            } catch (err) {
              toast({
                title: "An error occured",
                description: err.message,
                variant: "destructive",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          ✨ Generate
        </Button>
      </div>
      <Toaster />
    </main>
  );
}
