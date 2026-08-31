import { defineComponent, h, ref, computed, type PropType } from 'vue';
import type { User, Address, LoginInput, UpdateProfileInput, MfApolloClient } from '@shared/contracts';
import type { EventBus, MFEventMap } from '@shared/event-bus';
import { UserEvent } from '@shared/event-bus';

/**
 * Props accepted by the `UserPanel` component.
 *
 * The component is presentational: it renders the signed-in profile (or a
 * sign-in form when signed out) and emits cross-MF events. The host shell
 * performs the actual GraphQL mutations by wiring the `on*` callbacks to its
 * data layer (e.g. `signIn` / `signOut` / `updateProfile`).
 */
export interface UserPanelProps {
  /** The signed-in user, or `null` when signed out. */
  user: User | null;
  /** Shared event bus for cross-MF events (optional). */
  eventBus?: EventBus<MFEventMap> | null;
  /** Shared Apollo client for typed GraphQL queries/mutations (optional). */
  apolloClient?: MfApolloClient | null;
  /** Called when the user submits the sign-in form (host performs the mutation). */
  onSignIn?: (input: LoginInput) => void;
  /** Called when the user signs out (host performs the mutation). */
  onSignOut?: () => void;
  /** Called when the user updates their profile (host performs the mutation). */
  onUpdateProfile?: (input: UpdateProfileInput) => void;
}

/** Join an `Address` into a single display string. */
export function formatAddress(address: Address): string {
  const parts = [
    address.line1,
    address.city,
    address.state ?? '',
    address.postalCode,
    address.country,
  ].filter((part) => part !== '' && part != null);
  return parts.join(', ');
}

/**
 * A presentational Vue `UserPanel` component.
 *
 * When signed in it renders the user's profile (name, email, address) and a
 * sign-out button. When signed out it renders a sign-in form. It emits
 * cross-MF events (via the shared `EventBus`) on user actions; the actual
 * GraphQL mutations are performed by the host shell, which wires the `on*`
 * callbacks to its data layer.
 *
 * Styling uses Tailwind v4 utility classes (resolved by the host shell's
 * Tailwind build, which maps the shared design tokens into the `@theme`
 * namespace).
 */
export const UserPanel = defineComponent({
  name: 'UserPanel',
  props: {
    user: { type: Object as PropType<User | null>, required: true },
    eventBus: {
      type: Object as PropType<EventBus<MFEventMap> | null>,
      required: false,
      default: null,
    },
    apolloClient: {
      type: Object as PropType<MfApolloClient | null>,
      required: false,
      default: null,
    },
    onSignIn: { type: Function as PropType<(input: LoginInput) => void>, required: false },
    onSignOut: { type: Function as PropType<() => void>, required: false },
    onUpdateProfile: {
      type: Function as PropType<(input: UpdateProfileInput) => void>,
      required: false,
    },
  },
  setup(props) {
    const email = ref('');
    const password = ref('');
    const error = ref('');

    const signedIn = computed(() => props.user !== null);

    function submitSignIn(): void {
      error.value = '';
      props.onSignIn?.({ email: email.value, password: password.value });
      props.eventBus?.emit(UserEvent['user:signedIn'], {
        userId: props.user?.id ?? 'pending',
      });
    }

    function submitSignOut(): void {
      props.onSignOut?.();
      props.eventBus?.emit(UserEvent['user:signedOut'], {});
    }

    return () => {
      if (!signedIn.value) {
        return h(
          'section',
          {
            class:
              'mf-user flex flex-col gap-3 font-sans text-text-primary text-md leading-normal p-4 border border-border rounded-md bg-surface',
            'aria-label': 'Account',
          },
          [
            h('header', { class: 'flex items-center justify-between gap-2' }, [
              h('h2', { class: 'm-0 text-lg font-semibold' }, 'Sign in'),
            ]),
            h(
              'form',
              {
                class: 'flex flex-col gap-2',
                onSubmit: (event: Event) => {
                  event.preventDefault();
                  submitSignIn();
                },
              },
              [
                h('label', { class: 'flex flex-col gap-1 text-sm text-text-secondary' }, [
                  'Email',
                  h('input', {
                    class:
                      'p-2 border border-border rounded-sm bg-surface text-text-primary text-md',
                    type: 'email',
                    value: email.value,
                    onInput: (event: Event) => {
                      email.value = (event.target as HTMLInputElement).value;
                    },
                  }),
                ]),
                h('label', { class: 'flex flex-col gap-1 text-sm text-text-secondary' }, [
                  'Password',
                  h('input', {
                    class:
                      'p-2 border border-border rounded-sm bg-surface text-text-primary text-md',
                    type: 'password',
                    value: password.value,
                    onInput: (event: Event) => {
                      password.value = (event.target as HTMLInputElement).value;
                    },
                  }),
                ]),
                error.value
                  ? h('p', { class: 'm-0 text-danger text-sm' }, error.value)
                  : null,
                h(
                  'button',
                  {
                    class:
                      'p-2 border-0 rounded-sm bg-brand-500 text-text-inverse text-md font-medium cursor-pointer',
                    type: 'submit',
                  },
                  'Sign in',
                ),
              ],
            ),
          ],
        );
      }

      const user = props.user as User;
      return h(
        'section',
        {
          class:
            'mf-user flex flex-col gap-3 font-sans text-text-primary text-md leading-normal p-4 border border-border rounded-md bg-surface',
          'aria-label': 'Account',
        },
        [
          h('header', { class: 'flex items-center justify-between gap-2' }, [
            h('h2', { class: 'm-0 text-lg font-semibold' }, 'Your account'),
            h('span', { class: 'inline-block px-2 py-1 rounded-full bg-success text-text-inverse text-sm font-medium' }, 'Signed in'),
          ]),
          h('dl', { class: 'm-0 grid grid-cols-[auto_1fr] gap-y-1 gap-x-3' }, [
            h('dt', { class: 'text-text-secondary text-sm' }, 'Name'),
            h('dd', { class: 'm-0 text-md' }, user.name),
            h('dt', { class: 'text-text-secondary text-sm' }, 'Email'),
            h('dd', { class: 'm-0 text-md' }, user.email),
            h('dt', { class: 'text-text-secondary text-sm' }, 'Address'),
            h('dd', { class: 'm-0 text-md' }, formatAddress(user.address)),
          ]),
          h(
            'button',
            {
              class:
                'self-start p-2 border border-danger rounded-sm bg-transparent text-danger text-md cursor-pointer',
              type: 'button',
              onClick: submitSignOut,
            },
            'Sign out',
          ),
        ],
      );
    };
  },
});
