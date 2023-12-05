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
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.repository.fullName}</TableCell>
              <TableCell>{project.branch}</TableCell>
              <TableCell>{DateTime.fromJSDate(project.createdAt).toFormat("dd MMM yyyy")}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
