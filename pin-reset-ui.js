(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BizimSkorPinReset = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function validateResetInput({ name, newPin, confirmPin }) {
    const cleanName = normalizeName(name);
    const pin = String(newPin || '');
    if (cleanName.length < 2) return { ok: false, message: 'Oyuncu adını yazın.' };
    if (!/^\d{4}$/.test(pin)) return { ok: false, message: 'Yeni şifre yalnızca 4 rakamdan oluşmalıdır.' };
    if (pin !== String(confirmPin || '')) return { ok: false, message: 'Yeni şifreler birbiriyle aynı değil.' };
    return { ok: true, name: cleanName, pin };
  }

  function resetResultMessage(success) {
    return success
      ? 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.'
      : 'Bu hesap farklı bir cihazda kayıtlı. Şifre sıfırlamak için yöneticiyle iletişime geçin.';
  }

  function renderResetFormMarkup() {
    return '<button id="openPinReset" type="button" class="linkButton">Şifremi Unuttum</button>' +
      '<div id="pinResetMount" class="hide">' +
        '<form id="pinResetForm" style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb">' +
          '<label for="resetName">Oyuncu adın</label>' +
          '<input id="resetName" maxlength="40" autocomplete="username" placeholder="Oyuncu adını yaz">' +
          '<label for="resetPin" style="margin-top:8px">Yeni 4 haneli şifre</label>' +
          '<input id="resetPin" maxlength="4" inputmode="numeric" type="password" autocomplete="new-password" placeholder="••••">' +
          '<label for="resetPin2" style="margin-top:8px">Yeni şifre tekrar</label>' +
          '<input id="resetPin2" maxlength="4" inputmode="numeric" type="password" autocomplete="new-password" placeholder="••••">' +
          '<button id="submitPinReset" type="submit" class="full p" style="margin-top:10px">Şifremi Yenile</button>' +
          '<div id="pinResetStatus" class="small" role="status" aria-live="polite"></div>' +
        '</form>' +
      '</div>';
  }

  return { normalizeName, validateResetInput, resetResultMessage, renderResetFormMarkup };
});
