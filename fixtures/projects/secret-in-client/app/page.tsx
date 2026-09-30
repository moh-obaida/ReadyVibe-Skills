const key = process.env.NEXT_PUBLIC_SECRET_KEY;
export default function Page() {
  return key ?? "missing";
}
