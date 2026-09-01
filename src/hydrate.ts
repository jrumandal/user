import type { EventBus, MFEventMap } from '@jrumandal/event-bus';
import type { MfApolloClient } from '@jrumandal/contracts';
import { register } from './register';

/**
 * Hydrate all `<mf-user>` elements on the page.
 *
 * Registers the custom element (if not already registered) and attaches the
 * shared event bus and the shared Apollo client to each element so cross-MF
 * events flow through a single bus instance and the component can issue typed
 * GraphQL queries/mutations (e.g. `signIn` / `signOut` / `updateProfile`).
 * The element's `connectedCallback` performs the actual Vue hydration against
 * the existing SSR markup.
 */
export async function hydrate(options?: {
  eventBus?: EventBus<MFEventMap> | null;
  apolloClient?: MfApolloClient | null;
}): Promise<void> {
  await register();
  const elements = document.querySelectorAll('mf-user');
  elements.forEach((element) => {
    const el = element as HTMLElement & {
      eventBus?: EventBus<MFEventMap> | null;
      apolloClient?: MfApolloClient | null;
    };
    if (options?.eventBus) {
      el.eventBus = options.eventBus;
    }
    if (options?.apolloClient) {
      el.apolloClient = options.apolloClient;
    }
  });
}
