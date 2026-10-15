import { redirect } from "next/navigation";

// Members are managed once, in the Members module. Election reads that same list.
export default function Page() {
  redirect("/members");
}
