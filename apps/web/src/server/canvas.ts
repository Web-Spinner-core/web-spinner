"use server";

import { TLPageId } from "@tldraw/tldraw";
import { FileDiff, GitDiff } from "app/projects/[projectId]/canvas/layout";
import axios from "axios";
import { Page, Project, prisma } from "database";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { env } from "~/env";

const backendUrl = env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Fetch the canvas to page response from the backend
 */
export async function fetchCanvasToPageResponse(
  imageUrl: string,
  pageText: string,
  pageId: TLPageId,
  pageName: string,
  projectId: string
): Promise<string> {
  const result = await axios.post(`${backendUrl}/canvas/page`, {
    imageUrl,
    pageText,
    canvasPageId: pageId,
    pageName,
    projectId,
  });

  return z.string().parse(result.data);
}

/**
 * Create a pull request from the canvas
 */
export async function createPullRequestFromCanvas(
  pageId: string
): Promise<void> {
  await axios.post(`${backendUrl}/canvas/multi`, {
    pageId,
  });
}

/**
 * Get the pages for the given project
 */
export async function getPages(projectId: string): Promise<Page[]> {
  return prisma.page.findMany({
    where: {
      projectId,
    },
  });
}

const diffSchema = z
  .tuple([
    z.string(),
    z.number(),
    z
      .object({
        sha: z.string(),
        filename: z.string(),
        additions: z.number(),
        deletions: z.number(),
        changes: z.number(),
        patch: z.string(),
      })
      .array(),
  ])
  .array();

export async function revalidateServerTag(tag: string) {
  revalidateTag(tag);
}

/**
 * Get the diffs for the given pages
 */
export async function getDiffs(
  currentProject: Project,
  pages: Page[]
): Promise<Record<string, GitDiff>> {
  // Handle cases where no diffs are available
  const pagesWithPrs = pages.filter((page) => page.prNum);
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_URL}/diffs`, {
    method: "POST",
    body: JSON.stringify({
      pageIds: pagesWithPrs.map((page) => page.id),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    next: {
      tags: ["diffs"],
    },
  });
  const body = await response.json();
  const allDiffs = diffSchema.parse(body);

  const diffEntries = [] as [string, GitDiff][];
  for (const [pageId, prNum, diff] of allDiffs) {
    const additions = diff.reduce(
      (acc, fileDiff) => acc + fileDiff.additions,
      0
    );
    const deletions = diff.reduce(
      (acc, fileDiff) => acc + fileDiff.deletions,
      0
    );

    diffEntries.push([
      pages.find((page) => page.id === pageId).canvasPageId,
      {
        fileDiffs: diff as FileDiff[],
        additions,
        deletions,
        prLink: `https://github.com/${currentProject.repository.fullName}/pull/${prNum}`,
      },
    ]);
  }

  const diffs: { [key: string]: GitDiff } = Object.fromEntries(
    diffEntries.filter(([, diff]) => diff)
  );
  return diffs;
}
