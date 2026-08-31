import { render } from './ssr';
import { formatAddress } from './lib/user-panel';
import type { User, Address } from '@shared/contracts';

const address: Address = {
  line1: '1 Main St',
  city: 'Springfield',
  state: 'IL',
  postalCode: '62704',
  country: 'USA',
};

const user: User = {
  id: 'u-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  address,
};

describe('mf-user SSR', () => {
  it('renders the signed-in profile (name, email, address)', async () => {
    const html = await render({ user });
    expect(html).toContain('mf-user');
    expect(html).toContain('Your account');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('jane@example.com');
    expect(html).toContain('1 Main St');
    expect(html).toContain('Springfield');
    expect(html).toContain('Sign out');
  });

  it('renders the sign-in form when the user is null', async () => {
    const html = await render({ user: null });
    expect(html).toContain('mf-user');
    expect(html).toContain('Sign in');
    expect(html).toContain('Email');
    expect(html).toContain('Password');
    // The signed-in profile should NOT be present.
    expect(html).not.toContain('Your account');
    expect(html).not.toContain('Jane Doe');
  });

  it('emits no markup for the profile when signed out', async () => {
    const html = await render({ user: null });
    expect(html).not.toContain('Signed in');
  });

  it('formats an address into a single display string', () => {
    expect(formatAddress(address)).toBe('1 Main St, Springfield, IL, 62704, USA');
  });

  it('omits empty address parts when formatting', () => {
    const partial: Address = {
      line1: '2 Side St',
      city: 'Shelbyville',
      state: null,
      postalCode: '62705',
      country: 'USA',
    };
    expect(formatAddress(partial)).toBe('2 Side St, Shelbyville, 62705, USA');
  });
});
