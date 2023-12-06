import { auth } from "@clerk/nextjs";
import { prisma } from "database";
import { TitledHeader } from "~/components/header";
import CanvasPage from "./page";

interface Props {
  params: {
    projectId: string;
  };
  children: React.ReactNode;
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
      <CanvasPage project={currentProject} pages={pages} />
    </main>
  );
}
