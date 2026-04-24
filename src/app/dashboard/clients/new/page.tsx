import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientForm from "@/components/client-form";
import { createClientAction } from "@/features/clients/actions";

export default async function NewClientPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <ClientForm
          title="Novi klijent"
          description="Dodaj novog klijenta u bazu."
          action={createClientAction}
          submitLabel="Spremi klijenta"
          backHref="/dashboard/clients"
          backLabel="Natrag"
          initialValues={{
            full_name: "",
            phone: "",
            email: "",
            note: "",
            internal_note: "",
          }}
        />
      </div>
    </main>
  );
}
