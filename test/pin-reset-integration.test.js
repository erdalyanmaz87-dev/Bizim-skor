const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('giriş ekranı şifre sıfırlama yardımcısını yükler ve doğru etiketi gösterir', () => {
  assert.match(html, /<script src="pin-reset-ui\.js"><\/script>/);
  assert.match(html, /id="openPinReset"/);
  assert.match(html, />Şifremi Unuttum</);
  assert.doesNotMatch(html, />PIN.?imi Unuttum</i);
});

test('sıfırlama kayıtlı cihaz kimliğiyle güvenli RPC çağrısını yapar', () => {
  assert.match(html, /reset_player_pin_from_registered_device/);
  assert.match(html, /p_device_id:ensureDeviceId\(\)/);
  assert.match(html, /BizimSkorPinReset\.validateResetInput/);
  assert.match(html, /BizimSkorPinReset\.resetResultMessage/);
});

test('başarılı sıfırlama eski yerel oturumu temizler', () => {
  assert.match(html, /localStorage\.removeItem\('bizimSkorName'\)/);
  assert.match(html, /localStorage\.removeItem\('bizimSkorFriendToken'\)/);
});
