import { defineComponent, h, ref, computed, type PropType } from 'vue';
import type { User, Address, LoginInput, UpdateProfileInput, MfApolloClient } from '@jrumandal/contracts';
import { cssVar, Tokens } from '@jrumandal/design-tokens';
import type { EventBus, MFEventMap } from '@jrumandal/event-bus';
import { UserEvent } from '@jrumandal/event-bus';

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

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s3),
    fontFamily: cssVar(Tokens.font.familySans),
    color: cssVar(Tokens.color.textPrimary),
    fontSize: cssVar(Tokens.font.sizeMd),
    lineHeight: cssVar(Tokens.font.lineHeightNormal),
    padding: cssVar(Tokens.space.s4),
    border: `1px solid ${cssVar(Tokens.color.border)}`,
    borderRadius: cssVar(Tokens.radius.md),
    background: cssVar(Tokens.color.surface),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: cssVar(Tokens.space.s2),
  },
  title: {
    margin: 0,
    fontSize: cssVar(Tokens.font.sizeLg),
    fontWeight: cssVar(Tokens.font.weightSemibold),
  },
  badge: {
    display: 'inline-block',
    padding: `${cssVar(Tokens.space.s1)} ${cssVar(Tokens.space.s2)}`,
    borderRadius: cssVar(Tokens.radius.full),
    background: cssVar(Tokens.color.success),
    color: cssVar(Tokens.color.textInverse),
    fontSize: cssVar(Tokens.font.sizeSm),
    fontWeight: cssVar(Tokens.font.weightMedium),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s2),
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s1),
    fontSize: cssVar(Tokens.font.sizeSm),
    color: cssVar(Tokens.color.textSecondary),
  },
  input: {
    padding: cssVar(Tokens.space.s2),
    border: `1px solid ${cssVar(Tokens.color.border)}`,
    borderRadius: cssVar(Tokens.radius.sm),
    background: cssVar(Tokens.color.surface),
    color: cssVar(Tokens.color.textPrimary),
    fontSize: cssVar(Tokens.font.sizeMd),
  },
  error: {
    margin: 0,
    color: cssVar(Tokens.color.danger),
    fontSize: cssVar(Tokens.font.sizeSm),
  },
  primaryBtn: {
    padding: cssVar(Tokens.space.s2),
    border: 'none',
    borderRadius: cssVar(Tokens.radius.sm),
    background: cssVar(Tokens.color.brand500),
    color: cssVar(Tokens.color.textInverse),
    fontSize: cssVar(Tokens.font.sizeMd),
    fontWeight: cssVar(Tokens.font.weightMedium),
    cursor: 'pointer',
  },
  profile: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: `${cssVar(Tokens.space.s1)} ${cssVar(Tokens.space.s3)}`,
  },
  dt: {
    color: cssVar(Tokens.color.textSecondary),
    fontSize: cssVar(Tokens.font.sizeSm),
  },
  dd: {
    margin: 0,
    fontSize: cssVar(Tokens.font.sizeMd),
  },
  dangerBtn: {
    alignSelf: 'flex-start',
    padding: cssVar(Tokens.space.s2),
    border: `1px solid ${cssVar(Tokens.color.danger)}`,
    borderRadius: cssVar(Tokens.radius.sm),
    background: 'transparent',
    color: cssVar(Tokens.color.danger),
    fontSize: cssVar(Tokens.font.sizeMd),
    cursor: 'pointer',
  },
} as const;

/**
 * A presentational Vue `UserPanel` component.
 *
 * When signed in it renders the user's profile (name, email, address) and a
 * sign-out button. When signed out it renders a sign-in form. It emits
 * cross-MF events (via the shared `EventBus`) on user actions; the actual
 * GraphQL mutations are performed by the host shell, which wires the `on*`
 * callbacks to its data layer.
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
          { class: 'mf-user', style: styles.root, 'aria-label': 'Account' },
          [
            h('header', { style: styles.header }, [
              h('h2', { style: styles.title }, 'Sign in'),
            ]),
            h(
              'form',
              {
                style: styles.form,
                onSubmit: (event: Event) => {
                  event.preventDefault();
                  submitSignIn();
                },
              },
              [
                h('label', { style: styles.label }, [
                  'Email',
                  h('input', {
                    style: styles.input,
                    type: 'email',
                    value: email.value,
                    onInput: (event: Event) => {
                      email.value = (event.target as HTMLInputElement).value;
                    },
                  }),
                ]),
                h('label', { style: styles.label }, [
                  'Password',
                  h('input', {
                    style: styles.input,
                    type: 'password',
                    value: password.value,
                    onInput: (event: Event) => {
                      password.value = (event.target as HTMLInputElement).value;
                    },
                  }),
                ]),
                error.value ? h('p', { style: styles.error }, error.value) : null,
                h('button', { style: styles.primaryBtn, type: 'submit' }, 'Sign in'),
              ],
            ),
          ],
        );
      }

      const user = props.user as User;
      return h(
        'section',
        { class: 'mf-user', style: styles.root, 'aria-label': 'Account' },
        [
          h('header', { style: styles.header }, [
            h('h2', { style: styles.title }, 'Your account'),
            h('span', { style: styles.badge }, 'Signed in'),
          ]),
          h('dl', { style: styles.profile }, [
            h('dt', { style: styles.dt }, 'Name'),
            h('dd', { style: styles.dd }, user.name),
            h('dt', { style: styles.dt }, 'Email'),
            h('dd', { style: styles.dd }, user.email),
            h('dt', { style: styles.dt }, 'Address'),
            h('dd', { style: styles.dd }, formatAddress(user.address)),
          ]),
          h(
            'button',
            { style: styles.dangerBtn, type: 'button', onClick: submitSignOut },
            'Sign out',
          ),
        ],
      );
    };
  },
});
