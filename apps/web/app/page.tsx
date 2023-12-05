import { auth } from "@clerk/nextjs";
import { SkeletonPlaceholder, Toaster } from "@ui/components";
import { prisma } from "database";
import { Suspense } from "react";
import Header, { TitledHeader } from "~/components/header";
import ProjectsTable from "~/components/projects-table";

export default async function IndexPage() {
  const { userId } = auth();

  const projects = await prisma.project.findMany({
    where: {
      userId: userId,
    },
    include: {
      repository: true,
    },
  });

  return (
    <main className="h-full w-full flex flex-col p-5 pl-10 pt-5">
      <TitledHeader title="Projects" />
      <section className="p-4">
        <Suspense fallback={<SkeletonPlaceholder />}>
          <ProjectsTable projects={projects} />
        </Suspense>
      </section>
      <Toaster />
    </main>
  );
}
