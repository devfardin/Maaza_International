// /dashboard has no page of its own: members land on the Home page.
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard/home');
}
