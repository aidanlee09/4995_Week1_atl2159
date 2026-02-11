import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabaseUtils";
import DormsClient from "./DormsClient";

export default async function Home() {
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/login");
  }

  return <DormsClient />;
}
