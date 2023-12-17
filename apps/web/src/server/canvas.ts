"use server";

import { TLPageId } from "@tldraw/tldraw";
import { GitDiff } from "app/projects/[projectId]/canvas/layout";
import axios from "axios";
import { Page, Project, prisma } from "database";
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
  .object({
    sha: z.string(),
    filename: z.string(),
    additions: z.number(),
    deletions: z.number(),
    changes: z.number(),
    patch: z.string(),
  })
  .array();

/**
 * Get the diffs for the given pages
 */
export async function getDiffs(
  currentProject: Project,
  pages: Page[]
): Promise<Record<string, GitDiff>> {
  // Handle cases where no diffs are available
  const diffEntries = await Promise.all(
    pages
      .filter((page) => page.prNum)
      .map(async (page) => {
        try {
          const response = await axios.get(
            `${env.NEXT_PUBLIC_BACKEND_URL}/diffs/${page.id}`
          );
          const fileDiffs = diffSchema.parse(response.data);
          const additions = fileDiffs.reduce(
            (acc, fileDiff) => acc + fileDiff.additions,
            0
          );
          const deletions = fileDiffs.reduce(
            (acc, fileDiff) => acc + fileDiff.deletions,
            0
          );

          return [
            page.canvasPageId,
            {
              fileDiffs,
              additions,
              deletions,
              prLink: `https://github.com/${currentProject.repository.fullName}/pull/${page.prNum}`,
            },
          ];
        } catch (error) {
          return [page.canvasPageId, null];
        }
      })
  );
  const diffs: { [key: string]: GitDiff } = Object.fromEntries(
    diffEntries.filter(([, diff]) => diff)
  );
  return diffs;
}
