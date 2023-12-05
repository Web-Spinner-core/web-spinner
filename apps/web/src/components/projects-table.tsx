"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components";
import { Project, Repository } from "database";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";

type ProjectWithRepository = Project & {
  repository: Repository;
};

interface Props {
  projects: ProjectWithRepository[];
}

/**
 * Table for displaying the current user's projects
 */
export default function ProjectsTable({ projects }: Props) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>GitHub</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          return (
            <TableRow
              key={project.id}
              className="cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}/canvas`)}
            >
              <TableCell>
                <span className="font-semibold flex flex-row gap-2">
                  {project.name}
                </span>
              </TableCell>
              <TableCell>{project.repository.fullName}</TableCell>
              <TableCell>{project.branch}</TableCell>
              <TableCell>
                {DateTime.fromJSDate(project.createdAt).toFormat("dd MMM yyyy")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
