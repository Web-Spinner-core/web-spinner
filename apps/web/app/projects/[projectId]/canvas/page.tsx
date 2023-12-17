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
import CodeBlock from "@ui/components/code-block";
import FileDiffView from "@ui/components/file-diff";
import IconLabel from "@ui/components/icon-label";
import ComboBox from "@ui/components/ui/combobox";
import clsx from "clsx";
import { Page, Project, Repository } from "database";
import {
  FileDiffIcon,
  GitBranchIcon,
  GithubIcon,
  Loader2,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { convertEditorToCode } from "~/lib/editorToCode";
import { FileDiff, GitDiff } from "./layout";
import Link from "next/link";
import LoadingButton from "@ui/components/loading-button";

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
  const [selectedDiff, setSelectedDiff] = useState<GitDiff>();
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
        setSelectedDiff(diffs[pageId]);
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
              <div className="pl-2">{page}</div>
              <div>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code_standalone">
                  Code (Standalone)
                </TabsTrigger>
                <TabsTrigger value="code_changes">Code (PR)</TabsTrigger>
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
                    <CodeBlock text={standaloneCode} />
                  )}
                </TabsContent>
                <TabsContent
                  value="code_changes"
                  className="h-full overflow-x-auto overflow-y-auto"
                >
                  {selectedFileDiff == null ? (
                    <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
                      <span>Satisfied with the design?</span>
                      <LoadingButton
                        icon="🪄"
                        text="Create PR"
                        loading={false}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="w-full flex justify-between items-center mb-2 align-middle px-1 pl-3">
                        <div className="flex flex-row gap-10 items-center">
                          <div className="flex flex-row gap-2 font-medium text-sm">
                            <span className="flex flex-row text-muted-foreground">
                              <FileDiffIcon className="h-5" />
                              {selectedDiff?.fileDiffs.length ?? 0}
                            </span>
                            <span className="text-insert-foreground">
                              +{selectedDiff?.additions ?? 0}
                            </span>
                            <span className="text-delete-foreground">
                              -{selectedDiff?.deletions ?? 0}
                            </span>
                          </div>
                          <div className="flex flex-row gap-2">
                            <Link
                              href={selectedDiff?.prLink ?? ""}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button className="text-sm flex flex-row gap-2 bg-slate-900 hover:bg-slate-800 drop-shadow">
                                <GithubIcon />
                                View PR
                              </Button>
                            </Link>
                            <Button className="text-sm flex flex-row gap-2 bg-slate-900 hover:bg-slate-800 drop-shadow">
                              <RefreshCwIcon />
                              Rebuild
                            </Button>
                          </div>
                        </div>

                        <ComboBox
                          options={diffOptions}
                          placeholder="Select file"
                          selectedOption={selectedFileDiff.sha}
                          onOptionSelected={(option) => {
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
        <LoadingButton
          className="w-32"
          text="Generate"
          icon="✨"
          loading={editor == null || loading}
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
        />
      </div>
      <Toaster />
    </>
  );
}
