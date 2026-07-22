import BookingSuccessClient from "./success-client";

type BookingSuccessPageProps = {
  searchParams: Promise<{
    lang?: string;
    date?: string;
    time?: string;
    service?: string;
  }>;
};

export default async function BookingSuccessPage({
  searchParams,
}: BookingSuccessPageProps) {
  const params = await searchParams;

  return (
    <BookingSuccessClient
      lang={params.lang ?? null}
      date={params.date ?? null}
      time={params.time ?? null}
      service={params.service ?? null}
    />
  );
}
