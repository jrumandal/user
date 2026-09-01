import { renderToString } from '@vue/server-renderer';
import { createApp } from 'vue';
import { UserPanel, type UserPanelProps } from './lib/user-panel';

/**
 * Server-side render the `UserPanel` component to an HTML string.
 *
 * This is the SSR entry point used by the Angular SSR shell to produce the
 * initial markup for a `<mf-user>` element. The returned string is the
 * component's light-DOM content (no wrapper), so it can be dropped directly
 * into the element on the server and re-hydrated on the client.
 *
 * Note: Vue's `renderToString` is async, so this function returns a
 * `Promise<string>`.
 */
export async function render(props: UserPanelProps): Promise<string> {
  // Vue's `createApp` expects `Data` (an index-signature type); cast the
  // typed props object (via `unknown`) to satisfy it.
  const app = createApp(UserPanel, props as unknown as Record<string, unknown>);
  return renderToString(app);
}
