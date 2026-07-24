import { redirect } from "next/navigation";

/** Points / rewards economy removed — keep route for old links. */
export default function RewardsPage() {
  redirect("/profile");
}
