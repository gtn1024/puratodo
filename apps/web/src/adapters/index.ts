/**
 * Supabase Adapters - Web app implementations of adapter interfaces
 *
 * These adapters use Supabase Server Actions to implement the adapter interfaces
 * defined in @puratodo/api-types. They provide a consistent API for components
 * to interact with data, abstracting away the specific backend implementation.
 */

export { SupabaseTaskAdapter } from "./SupabaseTaskAdapter";
export { SupabaseListAdapter } from "./SupabaseListAdapter";
export { SupabaseGroupAdapter } from "./SupabaseGroupAdapter";
export { SupabaseAdapterProvider } from "./SupabaseAdapterProvider";
