"use client";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

import { clsx } from "clsx";
import { parse } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { DiffFile, LineType } from "diff2html/lib-esm/types";
import { Fragment, useEffect, useState } from "react";

interface Props {
  diff: string;
  filename?: string;
}

/**
 * A component for rendering a single Git file diff
 */
export default function FileDiffView({ diff: gitDiff, filename }: Props) {
  const [diff, setDiff] = useState<DiffFile>();
  const [code, setCode] = useState<string[]>();

  useEffect(() => {
    const header = `--- ${filename}\n+++ ${filename}\n`;
    const diffWithHeader = filename ? header + gitDiff : gitDiff;

    const [diff] = parse(diffWithHeader, {
      drawFileList: true,
    });
    const lines = diff.blocks.flatMap((block) =>
      block.lines.map((line) => line.content.substring(1))
    );
    const merged = lines.join("\n");
    const values = hljs.highlightAuto(merged, [
      "typescript",
      "javascript",
    ]).value;
    setDiff(diff);
    setCode(values.split("\n"));
  }, [gitDiff]);

  return (
    <table className="font-mono border-collapse w-full">
      <tbody>
        {diff?.blocks.map((block) => (
          <Fragment key={block.newStartLine}>
            <tr className="bg-white">
              <td className="sticky left-0 bg-white">
                <div className="w-16 sticky left-0 border-r border-gray-300 pr-3 whitespace-pre">
                  &nbsp;
                </div>
              </td>
              <td className="pl-2 text-gray-400">{block.header}</td>
            </tr>
            {block.lines.map((line, idx) => (
              <tr
                key={line.newNumber}
                className={clsx(
                  line.type === LineType.INSERT && "bg-insert-background",
                  line.type === LineType.DELETE && "bg-delete-background"
                )}
              >
                <td className="text-right text-gray-500 select-none sticky left-0">
                  <div className="w-16 sticky left-0 border-r border-gray-300 pr-3 bg-diff-insert">
                    <div>{line.oldNumber}</div>
                    <div>{line.newNumber}</div>
                  </div>
                </td>
                <td className="pl-3 flex gap-2 whitespace-pre">
                  <div className="select-none">{line.content[0]}</div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: code?.[idx] || "",
                    }}
                  />
                </td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
