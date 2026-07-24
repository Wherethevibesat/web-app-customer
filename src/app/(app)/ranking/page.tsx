import { redirect } from "next/navigation";

/** Leaderboard removed — keep route for old links. */
export default function RankingPage() {
  redirect("/discover");
}
