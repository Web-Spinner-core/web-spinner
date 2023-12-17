import clsx from "clsx";
import { Button } from "./ui";
import { Loader2 } from "lucide-react";

interface Props {
  className?: string;
  loading: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  text: string;
}

/**
 * A button that shows a loading indicator when clicked.
 */
export default function LoadingButton({
  className,
  loading,
  onClick,
  icon,
  text,
}: Props) {
  return (
    <Button
      className={clsx("bg-slate-900 hover:bg-slate-800 drop-shadow", className)}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="animate-spin mr-2" />
      ) : (
        <span className="mr-2">{icon}</span>
      )}{" "}
      {text}
    </Button>
  );
}
