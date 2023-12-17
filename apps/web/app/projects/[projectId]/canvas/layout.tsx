import { auth } from "@clerk/nextjs";
import axios from "axios";
import { prisma } from "database";
import { z } from "zod";
import { TitledHeader } from "~/components/header";
import { env } from "~/env";
import CanvasPage from "./page";
import { getDiffs } from "~/server/canvas";

interface Props {
  params: {
    projectId: string;
  };
  children: React.ReactNode;
}

export interface FileDiff {
  sha: string;
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
}

export interface GitDiff {
  fileDiffs: FileDiff[];
  additions: number;
  deletions: number;
  prLink: string;
}

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
  const diffs = await getDiffs(currentProject, pages);

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
