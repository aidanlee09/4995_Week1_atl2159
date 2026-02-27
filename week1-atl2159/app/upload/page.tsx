import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabaseUtils";
import ImageUploader from "./ImageUploader";

export default async function UploadPage() {
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/login");
  }

  return <ImageUploader session={data.session!} />;
}
