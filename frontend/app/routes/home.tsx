import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hamiltonian Path - SAT Solver" },
    { name: "description", content: "Hamiltonian Path - SAT Solver" },
  ];
}

export default function Home() {
  return <Welcome />;
}
