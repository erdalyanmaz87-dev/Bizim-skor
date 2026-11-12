(() => {
  'use strict';

  const hooks = window.BizimSkorMobileHooks;
  let session = null;
  let player = '';

  // Preview registration stays in memory. Real authentication and legacy login
  // are unavailable on this preview origin.
  hooks.legacyLogin = async () => { throw new Error('Önizlemede gerçek hesap kullanılmaz.'); };
  hooks.client = {
    functions: {
      invoke: async (_name, { body }) => ({ data: body.action === 'signup' ? {} : { error: 'invalid_credentials' } })
    },
    auth: {
      getSession: async () => ({ data: { session } }),
      verifyOtp: async ({ email, token }) => {
        if (token !== '123456') return { error: true };
        session = { user: { email, email_confirmed_at: new Date().toISOString() } };
        return { data: { session } };
      },
      signOut: async () => { session = null; return {}; }
    },
    rpc: async (name, args) => {
      if (name === 'mobile_account_status') return { data: { linked: Boolean(player) } };
      if (name === 'mobile_create_player') { player = args.p_name; return { data: true }; }
      if (name === 'mobile_issue_player_session') return { data: { player_name: player, token: 'first-run-preview' } };
      return { data: { error: 'invalid_request' } };
    }
  };

  const note = document.createElement('p');
  note.className = 'c';
  note.textContent = 'Android önizlemesi. Örnek bilgilerle kayıt olabilirsin. Doğrulama kodu 123456.';
  document.getElementById('home').prepend(note);
  localStorage.removeItem('bizimSkorName');
  localStorage.removeItem('bizimSkorFriendToken');
})();
