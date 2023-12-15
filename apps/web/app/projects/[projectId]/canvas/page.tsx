"use client";
import { Editor, TLPageId } from "@tldraw/tldraw";
import {
  Badge,
  Button,
  SkeletonPlaceholder,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  useToast,
} from "@ui/components";
import Canvas from "@ui/components/canvas";
import IconLabel from "@ui/components/icon-label";
import clsx from "clsx";
import { Page, Project, Repository } from "database";
import { GitBranchIcon, GithubIcon, Loader2 } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { CopyBlock, nord } from "react-code-blocks";
import { convertEditorToCode } from "~/lib/editorToCode";
import { FileDiff, GitDiff } from "./layout";
import FileDiffView from "@ui/components/file-diff";
import ComboBox from "@ui/components/ui/combobox";

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

interface CanvasPageProps {
  project: Project & {
    repository: Repository;
  };
  pages: Page[];
  diffs: {
    [key: string]: GitDiff;
  };
}

export default function CanvasPage({ project, pages, diffs }: CanvasPageProps) {
  const [editor, setEditor] = useState<Editor>();
  const [standaloneCode, setStandaloneCode] = useState<string>();

  const [diffOptions, setDiffOptions] =
    useState<{ value: string; label: string }[]>();
  const [fileDiffMap, setFileDiffMap] = useState<Record<string, FileDiff>>();
  const [selectedFileDiff, setSelectedFileDiff] = useState<FileDiff>();
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const [pageId, setPageId] = useState<TLPageId>();
  const [page, setPage] = useState<string>("");

  const [state, dispatch] = useReducer(
    reducer,
    Object.fromEntries(
      pages.map((page) => [page.canvasPageId, page.standaloneCode])
    ) as ReducerState
  );

  // Update page ID to trigger secondary effects
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
        const diffMap = diffs[pageId]?.fileDiffs?.reduce(
          (acc, diff) => ({ ...acc, [diff.sha]: diff }),
          {}
        );
        setFileDiffMap(diffMap);
        setDiffOptions(
          diffs[pageId]?.fileDiffs?.map((diff) => ({
            value: diff.sha,
            label: diff.filename,
          })) ?? []
        );

        const diff = diffs[pageId]?.fileDiffs?.[0];
        setSelectedFileDiff(diff);
      }
    }
  }, [pageId, editor]);

  const sectionWidth = "w-[45vw]";

  return (
    <>
      {/* Project info */}
      <section className="p-4 grid grid-cols-2 items-start justify-center">
        <div
          className={clsx(
            sectionWidth,
            "flex flex-col justify-self-center items-start gap-2"
          )}
        >
          <IconLabel
            icon={<GithubIcon />}
            label={project.repository.fullName}
          />
          <div className="flex flex-row gap-2">
            <Badge variant="secondary">{project.framework}</Badge>
            {project.frameworkOptions.map((option) => (
              <Badge variant="outline" key={`option_${option}`}>
                {option}
              </Badge>
            ))}
          </div>
        </div>
        <div
          className={clsx(
            sectionWidth,
            "flex flex-col justify-self-center items-start gap-2"
          )}
        >
          <IconLabel icon={<GitBranchIcon />} label={project.branch} />
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
            "flex items-start justify-center",
            "border border-gray-100"
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
                <TabsTrigger value="code_changes">Code (Changes)</TabsTrigger>
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
                <TabsContent
                  value="code_changes"
                  className="h-full overflow-x-auto overflow-y-auto"
                >
                  {selectedFileDiff == null ? (
                    <div className="p-4">No changes available</div>
                  ) : (
                    <div>
                      <div className="w-full flex items-end">
                        <ComboBox
                          options={diffOptions}
                          placeholder="Select file"
                          selectedOption={selectedFileDiff.sha}
                          onOptionSelected={option => {
                            setSelectedFileDiff(fileDiffMap[option]);
                          }}
                        />
                      </div>
                      <FileDiffView
                        diff={selectedFileDiff.patch}
                        filename={selectedFileDiff.filename}
                      />
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>
      {/* Button */}
      <div className="flex flex-row items-center justify-center mt-3">
        <Button
          className="w-32"
          disabled={editor == null || loading}
          onClick={async () => {
            setLoading(true);
            setStandaloneCode("");
            try {
              if (editor) {
                const result = await convertEditorToCode(editor, project.id);
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
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <span className="mr-2">✨</span>
          )}{" "}
          Generate
        </Button>
      </div>
      <Toaster />
    </>
  );
}
