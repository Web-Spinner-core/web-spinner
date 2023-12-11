import { auth } from "@clerk/nextjs";
import { prisma } from "database";
import { TitledHeader } from "~/components/header";
import CanvasPage from "./page";
import { z } from "zod";
import axios from "axios";
import { env } from "~/env";

interface Props {
  params: {
    projectId: string;
  };
  children: React.ReactNode;
}

export interface FileDiff {
  sha: string;
  filename: string;
  additions: string;
  deletions: string;
  changes: string;
  patch: string;
}

export interface GitDiff {
  fileDiffs: FileDiff[];
  additions: number;
  deletions: number;
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

export default async function CanvasLayout({ params: { projectId } }: Props) {
  const { userId } = auth();

  const [currentProject, projects, pages] = await Promise.all([
    prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        repository: true,
      },
    }),
    prisma.project.findMany({
      where: {
        userId,
      },
    }),
    prisma.page.findMany({
      where: {
        projectId,
      },
    }),
  ]);

  if (!currentProject) {
    return <div>Project not found</div>;
  }

  // Handle cases where no diffs are available
  const diffEntries = await Promise.all(
    pages.filter(page => page.prNum).map(async (page) => {
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

  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-5">
      <TitledHeader
        title={currentProject.name}
        options={projects.map((project) => ({
          label: project.name,
          value: project.id,
        }))}
        optionsPlaceholder="No projects found"
        selectedOption={currentProject.id}
      />
      <CanvasPage project={currentProject} pages={pages} diffs={diffs} />
    </main>
  );
}
