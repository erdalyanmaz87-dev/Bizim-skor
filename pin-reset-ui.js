(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.BizimSkorPinReset = api;
    api.mountUiIntegration(document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const LEGACY_ORIGIN = 'https://bizim-skor-live.vercel.app';

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
      : 'Bu tarayıcıda hesap sahipliği doğrulanamadı. Daha önce oyuna girdiğiniz cihaz ve tarayıcıdan tekrar deneyin.';
  }

  function requestLegacyDeviceId(root, timeoutMs = 3000) {
    if (!root?.document?.body || root.location?.origin === LEGACY_ORIGIN) return Promise.resolve(null);
    return new Promise(resolve => {
      const iframe = root.document.createElement('iframe');
      iframe.src = LEGACY_ORIGIN + '/device-bridge.html';
      iframe.title = 'Eski cihaz kaydı doğrulama';
      iframe.setAttribute?.('aria-hidden', 'true');
      iframe.style.display = 'none';
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        root.clearTimeout?.(timer);
        root.removeEventListener?.('message', onMessage);
        iframe.remove?.();
        resolve(value);
      };
      const onMessage = event => {
        const deviceId = String(event?.data?.deviceId || '');
        if (event?.origin !== LEGACY_ORIGIN || event?.source !== iframe.contentWindow) return;
        if (event?.data?.type !== 'bizimskor:legacy-device-id' || deviceId.length < 20 || deviceId.length > 200) return;
        finish(deviceId);
      };
      root.addEventListener('message', onMessage);
      const timer = root.setTimeout(() => finish(null), timeoutMs);
      root.document.body.appendChild(iframe);
    });
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

  function mountUiIntegration(doc) {
    if (!doc || doc.querySelector('script[data-bizim-ui-bootstrap="1"]')) return false;
    const script = doc.createElement('script');
    script.src = 'ui-integration-loader.js?v=20261020-ranking-scroll-perf-v1';
    script.defer = true;
    script.dataset.bizimUiBootstrap = '1';
    doc.head.appendChild(script);
    return true;
  }

  return { normalizeName, validateResetInput, resetResultMessage, requestLegacyDeviceId, renderResetFormMarkup, mountUiIntegration };
});
