(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BizimSkorInviteGrowth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function buildInviteLink(baseUrl, inviterId, leagueId) {
    const url = new URL(baseUrl);
    url.searchParams.set('invite', String(inviterId));
    if (leagueId) url.searchParams.set('league', String(leagueId));
    return url.toString();
  }
  function parseInviteParams(urlValue) {
    const url = new URL(urlValue, 'https://bizimskor.local');
    return {
      inviterId: url.searchParams.get('invite') || null,
      leagueId: url.searchParams.get('league') || null
    };
  }
  function isValidInviteAttribution(inviterId, newPlayerId, existingAttribution) {
    if (!inviterId || !newPlayerId) return false;
    if (String(inviterId) === String(newPlayerId)) return false;
    if (existingAttribution) return false;
    return true;
  }
  return { buildInviteLink, parseInviteParams, isValidInviteAttribution };
});
