const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateResetInput,
  resetResultMessage,
  renderResetFormMarkup,
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

test('farklı cihaz sonucu hesap varlığını ayrıntılandırmadan destek yönlendirmesi verir', () => {
  assert.match(resetResultMessage(false), /farklı bir cihazda kayıtlı/i);
  assert.match(resetResultMessage(false), /yöneticiyle iletişime geçin/i);
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
