/**
 * The console on its own opens on Stock, its first page.
 */

import { redirect } from 'next/navigation';

export default function ConsolePage() {
  redirect('/console/stock');
}
