import { getNavbarConfig } from "@/lib/site-config";
import { NavbarClient } from "./NavbarClient";

// Server component — fetches config from Supabase then passes to client
export async function Navbar() {
  const config = await getNavbarConfig();
  return <NavbarClient config={config} />;
}
