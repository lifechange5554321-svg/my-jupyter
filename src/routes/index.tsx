import { createFileRoute } from "@tanstack/react-router";
import { NotebookApp } from "@/notebook/NotebookApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <NotebookApp />;
}
