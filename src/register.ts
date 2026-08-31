import { UserElement } from './user-element';

/** The custom element tag name for the user micro-frontend. */
export const USER_ELEMENT_TAG = 'mf-user';

/**
 * Register the `mf-user` custom element.
 *
 * Safe to call multiple times: if the element is already defined, this is a
 * no-op. Throws if the environment does not support custom elements (e.g. a
 * very old browser), so the host can fall back to a non-custom-element
 * strategy.
 */
export async function register(): Promise<void> {
  if (typeof customElements === 'undefined') {
    throw new Error('Custom Elements are not supported in this environment.');
  }
  if (customElements.get(USER_ELEMENT_TAG)) {
    return;
  }
  customElements.define(USER_ELEMENT_TAG, UserElement);
}
