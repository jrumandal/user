import { createApp, type App } from 'vue';
import { UserPanel, type UserPanelProps } from './lib/user-panel';
import type { User, LoginInput, UpdateProfileInput, MfApolloClient } from '@shared/contracts';
import type { EventBus, MFEventMap } from '@shared/event-bus';

/**
 * A custom element that hosts the Vue `UserPanel` component in its light DOM.
 *
 * The element is framework-agnostic: the host shell (Angular SSR) can drop a
 * `<mf-user>` tag into the page, set the `data-user` attribute (or the `user`
 * property) and wire the `on*` callbacks to its data layer. The element
 * renders the Vue component into its light DOM (no Shadow DOM), so the SSR
 * markup and the hydrated markup are interchangeable.
 */
export class UserElement extends HTMLElement {
  static observedAttributes = ['data-user'];

  private _user: User | null = null;
  private _eventBus: EventBus<MFEventMap> | null = null;
  private _apolloClient: MfApolloClient | null = null;
  private _onSignIn?: (input: LoginInput) => void;
  private _onSignOut?: () => void;
  private _onUpdateProfile?: (input: UpdateProfileInput) => void;

  private _app: App | null = null;
  private _container: HTMLDivElement | null = null;

  /** The signed-in user, or `null` when signed out. */
  get user(): User | null {
    return this._user;
  }
  set user(value: User | null) {
    this._user = value;
    this.refresh();
  }

  /** Shared event bus for cross-MF events. */
  get eventBus(): EventBus<MFEventMap> | null {
    return this._eventBus;
  }
  set eventBus(value: EventBus<MFEventMap> | null) {
    this._eventBus = value;
    this.refresh();
  }

  /** Shared Apollo client for typed GraphQL queries/mutations. */
  get apolloClient(): MfApolloClient | null {
    return this._apolloClient;
  }
  set apolloClient(value: MfApolloClient | null) {
    this._apolloClient = value;
    this.refresh();
  }

  /** Called when the user submits the sign-in form. */
  set onSignIn(value: ((input: LoginInput) => void) | undefined) {
    this._onSignIn = value;
    this.refresh();
  }

  /** Called when the user signs out. */
  set onSignOut(value: (() => void) | undefined) {
    this._onSignOut = value;
    this.refresh();
  }

  /** Called when the user updates their profile. */
  set onUpdateProfile(value: ((input: UpdateProfileInput) => void) | undefined) {
    this._onUpdateProfile = value;
    this.refresh();
  }

  connectedCallback(): void {
    this.syncUserFromAttribute();
    if (this.hasSSRContent()) {
      this.hydrate();
    } else {
      this.render();
    }
  }

  disconnectedCallback(): void {
    this.unmount();
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    if (this.isConnected) {
      this.syncUserFromAttribute();
      this.refresh();
    }
  }

  /** Whether the element already contains server-rendered markup. */
  private hasSSRContent(): boolean {
    return this.childNodes.length > 0;
  }

  /** Parse the `data-user` attribute into the `user` property. */
  private syncUserFromAttribute(): void {
    const raw = this.getAttribute('data-user');
    if (raw === null) {
      return;
    }
    try {
      this._user = JSON.parse(raw) as User;
    } catch {
      this._user = null;
    }
  }

  /** Build the props object for the `UserPanel` component. */
  private buildProps(): UserPanelProps {
    return {
      user: this._user,
      eventBus: this._eventBus,
      apolloClient: this._apolloClient,
      onSignIn: this._onSignIn,
      onSignOut: this._onSignOut,
      onUpdateProfile: this._onUpdateProfile,
    };
  }

  /** Create a Vue app instance for the `UserPanel` component. */
  private createAppInstance(): App {
    // Vue's `createApp` expects `Data` (an index-signature type); cast the
    // typed props object (via `unknown`) to satisfy it.
    return createApp(UserPanel, this.buildProps() as unknown as Record<string, unknown>);
  }

  /** Render the Vue component into a fresh child container in the light DOM. */
  private render(): void {
    this.unmount();
    const container = document.createElement('div');
    this.appendChild(container);
    this._container = container;
    this._app = this.createAppInstance();
    this._app.mount(container);
  }

  /**
   * Hydrate against existing SSR markup: mount the Vue component into a fresh
   * child container, then remove the original server-rendered markup so the
   * client-rendered tree is the single source of truth.
   */
  private hydrate(): void {
    this.unmount();
    const container = document.createElement('div');
    this.appendChild(container);
    this._container = container;
    this._app = this.createAppInstance();
    this._app.mount(container);
    // Remove the original SSR markup (everything except our fresh container).
    for (const child of Array.from(this.childNodes)) {
      if (child !== container) {
        this.removeChild(child);
      }
    }
  }

  /** Re-render with the latest props (cheap: Vue reconciles in place). */
  private refresh(): void {
    if (this._app && this._container) {
      this._app.unmount();
      this._app = this.createAppInstance();
      this._app.mount(this._container);
    }
  }

  /** Unmount the Vue app and clear the light DOM. */
  private unmount(): void {
    if (this._app) {
      this._app.unmount();
      this._app = null;
    }
    this._container = null;
    this.textContent = '';
  }
}
