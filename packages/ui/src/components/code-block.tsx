"use client";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

interface Props {
  text: string;
}

/**
 * A component for rendering code
 */
export default function CodeBlock({ text }: Props) {
  const [code, setCode] = useState<string[]>();
  const [copyTransitioning, setCopyTransitioning] = useState(false);

  useEffect(() => {
    const values = hljs.highlightAuto(text).value;
    setCode(values.split("\n"));
  }, [text]);

  return (
    <>
      <div className="sticky top-0 right-0 pr-4 pt-4 w-full flex items-end justify-end">
        <CopyToClipboard text={text}>
          {copyTransitioning ? (
            <CheckIcon className="cursor-pointer h-4" />
          ) : (
            <CopyIcon
              className="cursor-pointer h-4"
              onClick={() => {
                setCopyTransitioning(true);
                setTimeout(() => {
                  setCopyTransitioning(false);
                }, 2000);
              }}
            />
          )}
        </CopyToClipboard>
      </div>
      <table className="font-mono border-collapse w-full mt-[-2rem]">
        <tbody>
          {code?.map((line, idx) => (
            <tr key={idx} className="bg-gray-50">
              <td className="text-right text-gray-500 select-none sticky left-0">
                <div className="w-16 sticky left-0 border-r border-gray-300 pr-3">
                  <div>{idx + 1}</div>
                </div>
              </td>
              <td className="pl-3 flex gap-2 whitespace-pre">
                <div
                  dangerouslySetInnerHTML={{
                    __html: line,
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
