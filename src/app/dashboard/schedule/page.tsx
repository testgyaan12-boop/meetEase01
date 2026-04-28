
import { redirect } from "next/navigation"

export default function ScheduleRedirectPage() {
  // Redirect to the main dashboard as it contains the schedule form
  redirect("/dashboard")
}
