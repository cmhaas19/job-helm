import { redirect } from "next/navigation";

export default function JobDetailRedirect() {
  redirect("/dashboard/jobs");
}
