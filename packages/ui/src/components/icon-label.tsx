import React, { ReactNode } from "react";
import { cn } from "@ui/lib/utils";

interface Props {
  icon: ReactNode;
  label: string;
  className?: string;
}

export default function IconLabel({
  icon,
  label,
  className,
}: Props): ReactNode {
  return (
    <div className={cn(className, "flex row gap-4 align-middle items-center")}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
