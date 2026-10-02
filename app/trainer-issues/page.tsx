import { redirect } from "next/navigation";

// Trainer issues are now raised as support tickets inside the LMS, where the
// trainee is signed in and their trainers are known.
export default function TrainerIssuesPage() {
  redirect("/learn/lms/support");
}
