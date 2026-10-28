const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateResetInput,
  resetResultMessage,
  renderResetFormMarkup,
  requestLegacyDeviceId,
} = require('../pin-reset-ui.js');

test('şifre sıfırlama yalnız oyuncu adı ve dört rakamlı eşleşen şifreyi kabul eder', () => {
  assert.deepEqual(validateResetInput({ name: '  Çağatay  ', newPin: '1234', confirmPin: '1234' }), {
    ok: true,
    name: 'Çağatay',
    pin: '1234',
  });
  assert.equal(validateResetInput({ name: '', newPin: '1234', confirmPin: '1234' }).ok, false);
  assert.equal(validateResetInput({ name: 'Çağatay', newPin: '123', confirmPin: '123' }).ok, false);
  assert.equal(validateResetInput({ name: 'Çağatay', newPin: '12a4', confirmPin: '12a4' }).ok, false);
  assert.equal(validateResetInput({ name: 'Çağatay', newPin: '1234', confirmPin: '4321' }).ok, false);
});

test('başarısız doğrulama yöneticiyi aratmadan güvenli yeniden deneme bilgisi verir', () => {
  assert.match(resetResultMessage(false), /hesap sahipliği doğrulanamadı/i);
  assert.doesNotMatch(resetResultMessage(false), /farklı bir cihazda kayıtlı/i);
  assert.doesNotMatch(resetResultMessage(false), /yöneticiyle iletişime geçin/i);
  assert.match(resetResultMessage(false), /daha önce oyuna girdiğiniz cihaz ve tarayıcıdan/i);
  assert.doesNotMatch(resetResultMessage(false), /bulunamadı/i);
});

test('form kullanıcıya Şifremi Unuttum ve Şifremi Yenile ifadelerini gösterir', () => {
  const html = renderResetFormMarkup();
  assert.match(html, /Şifremi Unuttum/);
  assert.match(html, /Şifremi Yenile/);
  assert.match(html, /id="resetPin"[^>]*maxlength="4"/);
  assert.match(html, /id="resetPin2"[^>]*maxlength="4"/);
  assert.doesNotMatch(html, /PIN.?imi Unuttum/i);
});

test('eski Vercel adresindeki kayıtlı cihaz kimliğini yalnız güvenilir kaynaktan alır', async () => {
  const listeners = new Map();
  const iframe = { style: {}, contentWindow: {} };
  const root = {
    location: { origin: 'https://bizimskor.com' },
    document: {
      createElement: () => iframe,
      body: { appendChild: () => {} },
    },
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: type => listeners.delete(type),
    setTimeout: fn => { root.onTimeout = fn; return 1; },
    clearTimeout: () => {},
  };

  const pending = requestLegacyDeviceId(root, 100);
  assert.equal(iframe.src, 'https://bizim-skor-live.vercel.app/device-bridge.html');
  listeners.get('message')({
    origin: 'https://evil.example',
    source: iframe.contentWindow,
    data: { type: 'bizimskor:legacy-device-id', deviceId: '12345678901234567890' },
  });
  listeners.get('message')({
    origin: 'https://bizim-skor-live.vercel.app',
    source: iframe.contentWindow,
    data: { type: 'bizimskor:legacy-device-id', deviceId: '12345678901234567890' },
  });

  assert.equal(await pending, '12345678901234567890');
});
