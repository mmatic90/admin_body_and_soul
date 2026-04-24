import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientForm from "@/components/client-form";
import { getClientById } from "@/features/clients/queries";
import { updateClientAction } from "@/features/clients/actions";

type Params = Promise<{
  id: string;
}>;

export default async function EditClientPage({ params }: { params: Params }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const boundAction = updateClientAction.bind(null, client.id);

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <ClientForm
          title="Uredi klijenta"
          description="Ažuriraj podatke o klijentu."
          action={boundAction}
          submitLabel="Spremi izmjene"
          backHref={`/dashboard/clients/${client.id}`}
          backLabel="Natrag"
          initialValues={{
            full_name: client.full_name,
            phone: client.phone ?? "",
            email: client.email ?? "",
            note: client.note ?? "",
            internal_note: client.internal_note ?? "",
          }}
        />
      </div>
    </main>
  );
}
