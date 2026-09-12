(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BizimSkorFriendLeagues = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function effectiveStartWeek(currentWeek, firstKickoff, now = new Date()) {
    return new Date(now) < new Date(firstKickoff)
      ? Number(currentWeek)
      : Number(currentWeek) + 1;
  }

  function canCreateLeague(createdCount) {
    return Number(createdCount) < 3;
  }

  function normalizeLeagueName(value) {
    const name = String(value || '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 60) {
      throw new Error('Lig adı 1-60 karakter arasında olmalıdır.');
    }
    return name;
  }

  function rankFriendLeague(rows) {
    const created = value => {
      const time = new Date(value || 0).getTime();
      return Number.isFinite(time) && value ? time : Number.MAX_SAFE_INTEGER;
    };
    return [...rows].sort((a, b) =>
      b.points - a.points ||
      Number(b.inviteCount || 0) - Number(a.inviteCount || 0) ||
      b.exact - a.exact ||
      b.correct - a.correct ||
      created(a.createdAt) - created(b.createdAt) ||
      a.name.localeCompare(b.name, 'tr')
    ).map((row,index)=>({ ...row, rank:index+1 }));
  }

  return { effectiveStartWeek, canCreateLeague, normalizeLeagueName, rankFriendLeague };
});
