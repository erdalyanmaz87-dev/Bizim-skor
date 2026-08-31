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
    const sorted = [...rows].sort((a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.correct - a.correct ||
      a.name.localeCompare(b.name, 'tr')
    );
    let previousPoints = null;
    let rank = 0;
    return sorted.map(row => {
      if (row.points !== previousPoints) {
        rank += 1;
        previousPoints = row.points;
      }
      return { ...row, rank };
    });
  }

  return { effectiveStartWeek, canCreateLeague, normalizeLeagueName, rankFriendLeague };
});
