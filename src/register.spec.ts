import { register, USER_ELEMENT_TAG } from './register';
import { UserElement } from './user-element';
import type { User } from '@jrumandal/contracts';

const user: User = {
  id: 'u-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  address: {
    line1: '1 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'USA',
  },
};

describe('mf-user register', () => {
  beforeEach(() => {
    // Clear the DOM between tests. (The custom element itself is registered
    // once per test file; `register()` is idempotent, so no undefine is needed.)
    document.body.innerHTML = '';
  });

  it('registers the mf-user custom element', async () => {
    await register();
    expect(customElements.get(USER_ELEMENT_TAG)).toBe(UserElement);
  });

  it('is idempotent (safe to call multiple times)', async () => {
    await register();
    await register();
    expect(customElements.get(USER_ELEMENT_TAG)).toBe(UserElement);
  });

  it('renders the signed-in profile into the light DOM', async () => {
    await register();
    const el = document.createElement(USER_ELEMENT_TAG) as UserElement;
    el.user = user;
    document.body.appendChild(el);

    // Vue renders asynchronously; wait a tick for the component to mount.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el.querySelector('.mf-user')).not.toBeNull();
    expect(el.textContent).toContain('Jane Doe');
    expect(el.textContent).toContain('Your account');
  });

  it('renders the sign-in form when signed out', async () => {
    await register();
    const el = document.createElement(USER_ELEMENT_TAG) as UserElement;
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el.querySelector('.mf-user')).not.toBeNull();
    expect(el.textContent).toContain('Sign in');
    expect(el.textContent).not.toContain('Your account');
  });

  it('reads the user from the data-user attribute', async () => {
    await register();
    const el = document.createElement(USER_ELEMENT_TAG) as UserElement;
    el.setAttribute('data-user', JSON.stringify(user));
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el.user).toEqual(user);
    expect(el.textContent).toContain('Jane Doe');
  });
});
