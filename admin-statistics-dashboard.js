(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.BizimSkorAdminStatisticsDashboard = api;
    api.autoMount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  const esc = (v) =>
    String(v ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  const num = (v) => (v === null || v === undefined ? '—' : Number(v || 0));
  const pct = (v) =>
    v === null || v === undefined ? '—' : `%${Number(v || 0)}`;
  const arenaLabels = {
    champions: 'Şampiyonlar',
    elite: 'Elit Lig',
    gold: 'Altın Lig',
    silver: 'Gümüş Lig',
    bronze: 'Bronz Lig',
  };
  let latestData = {};
  function token() {
    return String(root?.localStorage?.getItem?.('bizimSkorFriendToken') || '');
  }
  function trTime(v) {
    if (!v) return '—';
    try {
      return new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(v));
    } catch {
      return '—';
    }
  }
  function button(doc) {
    const b = doc.createElement('button');
    b.id = 'openAdminStatistics';
    b.type = 'button';
    b.className = 'bs-home-stat admin-statistics';
    b.innerHTML = '<span>Yönetim</span><b>📊 Yönetici İstatistikleri</b>';
    return b;
  }
  function list(title, rows, detail) {
    const id =
      'list-' +
      String(title)
        .toLocaleLowerCase('tr-TR')
        .replace(/[^a-z0-9]+/g, '-');
    return `<section class="bs-admin-stats-group"><h3>${esc(title)} <small>(${rows.length})</small></h3><div id="${id}" class="bs-admin-stats-list compact bs-admin-stats-columns">${rows.length ? rows.map((x, i) => `<div${i >= 6 ? ' class="bs-admin-stats-extra"' : ''}><button type="button" class="bs-admin-player" data-admin-player="${esc(x.player_name)}"><b>${esc(x.player_name)}</b><span>${esc(detail(x))}</span></button></div>`).join('') : '<p>Bu grupta oyuncu yok.</p>'}</div>${rows.length > 6 ? `<button type="button" class="bs-admin-stats-toggle" data-admin-stats-toggle="${id}" aria-expanded="false">Tümünü Göster (${rows.length})</button>` : ''}</section>`;
  }
  function render(data) {
    latestData = data || {};
    const s = data?.summary || {},
      all = data?.players || [],
      completed = [...(data?.completed || all.filter((x) => x.completed))].sort((a, b) => {
        const aTime = Date.parse(a.completed_at || '') || 0,
          bTime = Date.parse(b.completed_at || '') || 0;
        return bTime - aTime;
      }),
      incomplete = data?.incomplete || all.filter((x) => !x.completed),
      today =
        data?.today || all.filter((x) => Number(x.today_launch_count || 0) > 0),
      notifications =
        data?.notifications || all.filter((x) => x.notification_enabled),
      reminderYes =
        data?.reminder_yes || all.filter((x) => x.reminder_response === 'yes'),
      reminderLater =
        data?.reminder_later ||
        all.filter((x) => x.reminder_response === 'later');
    return `<div class="bs-admin-stats"><p class="small">${esc(data?.season || '')} ${data?.week ? `• ${Number(data.week)}. Hafta` : ''}</p><div class="bs-admin-stats-grid"><b>Toplam Oyuncu <strong>${num(s.total_players ?? all.length)}</strong></b><b>Bugün Gelen <strong>${num(s.active_today)}</strong></b><b>Yeni Kayıt <strong>${num(s.new_today)}</strong></b><b>Tahmin Yapan <strong>${num(s.completed)}</strong></b><b>Tahmin Yapmayan <strong>${num(s.incomplete)}</strong></b><b>Katılım <strong>${pct(s.participation)}</strong></b><b>Bildirim Açık <strong>${num(s.notifications_enabled)}</strong></b><b>24s Evet <strong>${num(s.reminder_yes)}</strong></b><b>24s Daha Sonra <strong>${num(s.reminder_later)}</strong></b><b>Uyarı Sonrası Tamamlayan <strong>${num(s.reminder_converted)}</strong></b></div>${list('Oyuna Girenler', today, (x) => `${trTime(x.today_first)}–${trTime(x.today_last)} · ${Number(x.today_launch_count || 0)} giriş`)}${list('Güncel Hafta Tahmin Yapanlar', completed, (x) => `${Number(x.saved_count || 0)}/${Number(x.fixture_count || 0)} maç · Tamamladı`)}${list('Güncel Hafta Tahmin Yapmayanlar', incomplete, (x) => `${Number(x.saved_count || 0)}/${Number(x.fixture_count || 0)} maç`)}${list('Bildirimleri Açanlar', notifications, (x) => 'Bildirim açık')}${list('24 Saat Uyarısı · Evet', reminderYes, (x) => (x.reminder_completed ? 'Sonradan tamamladı ✓' : 'Henüz tamamlamadı'))}${list('24 Saat Uyarısı · Daha Sonra', reminderLater, (x) => (x.reminder_completed ? 'Sonradan tamamladı ✓' : 'Henüz tamamlamadı'))}</div>`;
  }
  const rank = (v) => (Number(v) > 0 ? `${Number(v)}.` : 'Katılmadı');
  const points = (v) => {
    if (v === null || v === undefined) return '';
    const n = Number(v);
    return `${Number.isInteger(n) ? n : n.toFixed(2)} puan`;
  };
  function stat(label, value, point) {
    return `<div><span>${esc(label)}</span><b>${esc(value)}</b>${point !== null && point !== undefined ? `<small>${esc(points(point))}</small>` : ''}</div>`;
  }
  function renderPlayerCard(model = {}) {
    const p = model.prediction || {},
      arena = model.arena || {},
      arenaText = arena.league
        ? `${arena.league} • ${rank(arena.rank)}`
        : 'Katılmadı';
    return `<div class="bs-admin-player-head"><div><span>OYUNCU DURUM KARTI</span><h2>${esc(model.name || 'Oyuncu')}</h2></div><button type="button" data-admin-player-close aria-label="Kapat">×</button></div><div class="bs-admin-player-prediction"><span>Güncel Hafta</span><b>${Number(p.saved || 0)}/${Number(p.total || 0)} maç • ${p.completed ? 'Tamamladı ✓' : 'Eksik'}</b></div><div class="bs-admin-player-grid">${stat('Süper Lig Haftalık', rank(model.superWeek?.rank), model.superWeek?.points)}${stat('Süper Lig Genel', rank(model.superGeneral?.rank), model.superGeneral?.points)}${stat('Arena', arenaText, arena.points == null ? null : Number(arena.points).toFixed(2))}${stat('Şampiyonlar Ligi Genel', rank(model.champions?.rank), model.champions?.points)}${stat('Uluslar Ligi Genel', rank(model.nations?.rank), model.nations?.points)}</div>`;
  }
  const norm = (v) =>
    String(v || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('tr-TR');
  const rowFor = (rows, name) =>
    (rows || []).find((x) => norm(x.player_name) === norm(name)) || null;
  async function rpc(name, args) {
    const q = await root.sb.rpc(name, args);
    if (q.error) throw q.error;
    return q.data || [];
  }
  async function loadPlayerCard(name) {
    const t = token(),
      season = latestData.season || '2026/27',
      week = Number(latestData.week) || undefined,
      player = rowFor(latestData.players, name) || {};
    const calls = await Promise.allSettled([
      rpc('get_player_public_profile_v2', {
        p_token: t,
        p_player_name: name,
        ...(week ? { p_week: week } : {}),
      }),
      rpc('get_super_league_general_ranking', {}),
      rpc('get_arena_player_card', { p_token: t, p_player_name: name }),
      rpc('get_champions_league_ranking', { p_token: t, p_season: season }),
      rpc('get_nations_league_ranking', { p_token: t, p_season: season }),
    ]);
    const data = (i) => (calls[i].status === 'fulfilled' ? calls[i].value : []),
      superWeek = (data(0) || [])[0] || {},
      arenaRaw = Array.isArray(data(2)) ? data(2)[0] : data(2),
      superGeneral = rowFor(data(1), name),
      champions = rowFor(data(3), name),
      nations = rowFor(data(4), name);
    return {
      name: player.player_name || name,
      prediction: {
        saved: Number(player.saved_count || 0),
        total: Number(player.fixture_count || 0),
        completed: Boolean(player.completed),
      },
      superWeek: { rank: superWeek.week_rank, points: superWeek.week_points },
      superGeneral: {
        rank: superGeneral?.league_rank,
        points: superGeneral?.total_points,
      },
      arena: arenaRaw
        ? {
            league: arenaLabels[arenaRaw.league_code] || arenaRaw.league_code,
            rank: arenaRaw.league_rank ?? arenaRaw.rank_in_league,
            points: arenaRaw.performance_score,
          }
        : null,
      champions: { rank: champions?.league_rank, points: champions?.points },
      nations: { rank: nations?.league_rank, points: nations?.points },
    };
  }
  async function openPlayer(name, doc = root.document) {
    const shell = doc.getElementById('adminPlayerCard'),
      body = shell?.querySelector('[data-admin-player-body]');
    if (!shell || !body) return;
    shell.classList.remove('hide');
    body.innerHTML = '<p class="small">Oyuncu bilgileri yükleniyor…</p>';
    try {
      body.innerHTML = renderPlayerCard(await loadPlayerCard(name));
    } catch (e) {
      body.innerHTML = `<p>Oyuncu bilgileri alınamadı: ${esc(e.message)}</p>`;
    }
  }
  function closePlayer(doc = root.document) {
    doc.getElementById('adminPlayerCard')?.classList.add('hide');
  }
  async function privileged() {
    const q = await root.sb.rpc('get_admin_statistics_dashboard', {
      p_token: token(),
    });
    if (q.error) throw q.error;
    return q.data || {};
  }
  async function fallback() {
    const dir = await root.sb.rpc('list_player_ranking_directory', {
      p_token: token(),
    });
    if (dir.error) throw dir.error;
    const players = (dir.data || []).filter((x) => x.is_active !== false);
    const fx = await root.sb
      .from('fixtures')
      .select('id,season,week,kickoff')
      .order('kickoff', { ascending: true });
    if (fx.error) throw fx.error;
    const now = Date.now(),
      fixtures = fx.data || [],
      target =
        fixtures.find((x) => new Date(x.kickoff).getTime() > now) ||
        fixtures[fixtures.length - 1];
    if (!target)
      return {
        summary: {
          total_players: players.length,
          completed: 0,
          incomplete: players.length,
          participation: 0,
        },
        players: [],
      };
    const current = fixtures.filter(
        (x) =>
          x.season === target.season && Number(x.week) === Number(target.week),
      ),
      ids = current.map((x) => x.id),
      fixtureCount = ids.length;
    const pq = ids.length
      ? await root.sb
          .from('predictions')
          .select('player_name,fixture_id')
          .in('fixture_id', ids)
      : { data: [], error: null };
    if (pq.error) throw pq.error;
    const counts = new Map();
    for (const p of pq.data || []) {
      const k = String(p.player_name || '')
        .trim()
        .toLocaleLowerCase('tr-TR');
      if (!counts.has(k)) counts.set(k, new Set());
      counts.get(k).add(Number(p.fixture_id));
    }
    const rows = players
      .map((p) => {
        const k = String(p.name || '')
            .trim()
            .toLocaleLowerCase('tr-TR'),
          saved = counts.get(k)?.size || 0;
        return {
          player_name: p.name,
          saved_count: saved,
          fixture_count: fixtureCount,
          completed: fixtureCount > 0 && saved === fixtureCount,
        };
      })
      .sort((a, b) =>
        String(a.player_name).localeCompare(String(b.player_name), 'tr'),
      );
    const completed = rows.filter((x) => x.completed).length;
    return {
      season: target.season,
      week: Number(target.week),
      summary: {
        total_players: rows.length,
        active_today: null,
        new_today: null,
        completed,
        incomplete: rows.length - completed,
        participation: rows.length
          ? Math.round((100 * completed) / rows.length)
          : 0,
        notifications_enabled: null,
        reminder_yes: null,
        reminder_later: null,
        reminder_converted: null,
      },
      players: rows,
      incomplete: rows.filter((x) => !x.completed),
      today: [],
      notifications: [],
      reminder: [],
    };
  }
  async function load() {
    try {
      return await privileged();
    } catch (e) {
      console.warn('admin statistics privileged fallback', e);
      return fallback();
    }
  }
  function nav() {
    return root?.BizimSkorScreenNavigationRuntime;
  }
  async function open(doc) {
    const host = doc.getElementById('adminStatisticsModal');
    if (!host) return;
    host.classList.remove('hide');
    nav()?.openDetail?.('adminStatistics', {
      title: 'Yönetici İstatistikleri',
      onClose: () => host.classList.add('hide'),
    });
    host.querySelector('[data-admin-stats-body]').innerHTML =
      '<p>İstatistikler yükleniyor…</p>';
    try {
      host.querySelector('[data-admin-stats-body]').innerHTML = render(
        await load(),
      );
    } catch (e) {
      host.querySelector('[data-admin-stats-body]').innerHTML =
        '<p>İstatistikler şu anda alınamadı.</p>';
      console.warn('admin statistics', e);
    }
  }
  function close(doc) {
    const host = doc.getElementById('adminStatisticsModal'),
      runtime = nav();
    if (runtime?.snapshot?.().detailId === 'adminStatistics') {
      runtime.back?.();
      return true;
    }
    host?.classList.add('hide');
    return true;
  }
  function mount(doc = root?.document) {
    if (!doc || doc.getElementById('openAdminStatistics')) return true;
    const admin = doc.getElementById('openSupportAdmin');
    if (!admin || !root?.sb?.rpc) return false;
    const wrap = doc.querySelector('#bsHomeDashboard .bs-home-stats');
    if (!wrap) return false;
    const style = doc.createElement('style');
    style.textContent =
      '.bs-admin-stats-group{margin-top:14px}.bs-admin-stats-group h3{margin:0 0 7px}.bs-admin-stats-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.bs-admin-stats-columns>div{min-width:0;padding:0;border-radius:10px;background:#f8fafc}.bs-admin-player{width:100%;height:100%;padding:8px;text-align:left;background:transparent;color:#0f172a}.bs-admin-player b,.bs-admin-player span{display:block;overflow:hidden;text-overflow:ellipsis}.bs-admin-player span{font-size:11px;color:#64748b;margin-top:2px}.bs-admin-stats-list:not(.expanded) .bs-admin-stats-extra{display:none}.bs-admin-stats-toggle{width:100%;margin-top:7px;padding:8px;background:#e2e8f0;color:#0f172a}.bs-admin-player-modal{position:fixed;inset:0;z-index:10060;display:flex;align-items:flex-end;justify-content:center}.bs-admin-player-modal.hide{display:none}.bs-admin-player-backdrop{position:absolute;inset:0;background:rgba(3,12,28,.64)}.bs-admin-player-card{position:relative;width:min(100%,560px);max-height:88vh;overflow:auto;background:#f8fafc;border-radius:24px 24px 0 0;padding:20px;color:#0f172a}.bs-admin-player-head{display:flex;justify-content:space-between}.bs-admin-player-head span{font-size:11px;letter-spacing:2px;color:#64748b;font-weight:900}.bs-admin-player-head h2{margin:4px 0 14px}.bs-admin-player-head button{width:38px;height:38px;border-radius:50%;font-size:24px}.bs-admin-player-prediction{display:flex;justify-content:space-between;gap:8px;padding:12px;border-radius:14px;background:#eaf2ff}.bs-admin-player-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.bs-admin-player-grid>div{padding:12px 8px;border:1px solid #dbe3ee;border-radius:14px;text-align:center;background:#fff}.bs-admin-player-grid span,.bs-admin-player-grid small{display:block;font-size:11px;color:#64748b}.bs-admin-player-grid b{display:block;font-size:17px;margin:5px 0}@media(max-width:360px){.bs-admin-stats-columns,.bs-admin-player-grid{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
    const b = button(doc);
    wrap.appendChild(b);
    const modal = doc.createElement('div');
    modal.id = 'adminStatisticsModal';
    modal.className = 'bs-admin-stats-modal hide';
    modal.innerHTML =
      '<section><header><button type="button" data-admin-stats-close>← Geri</button><h2>Yönetici İstatistikleri</h2><span></span></header><main data-admin-stats-body></main></section>';
    doc.body.appendChild(modal);
    const playerModal = doc.createElement('div');
    playerModal.id = 'adminPlayerCard';
    playerModal.className = 'bs-admin-player-modal hide';
    playerModal.innerHTML =
      '<div class="bs-admin-player-backdrop" data-admin-player-close></div><section class="bs-admin-player-card" data-admin-player-body role="dialog" aria-modal="true"></section>';
    doc.body.appendChild(playerModal);
    b.addEventListener('click', () => open(doc));
    doc.addEventListener('click', (e) => {
      const player = e.target.closest?.('[data-admin-player]');
      if (player) openPlayer(player.dataset.adminPlayer, doc);
    });
    modal.addEventListener('click', (e) => {
      const toggle = e.target.closest?.('[data-admin-stats-toggle]');
      if (toggle) {
        const list = doc.getElementById(toggle.dataset.adminStatsToggle),
          expanded = list?.classList.toggle('expanded');
        toggle.setAttribute('aria-expanded', String(Boolean(expanded)));
        toggle.textContent = expanded
          ? 'Daralt'
          : `Tümünü Göster (${list?.children.length || 0})`;
        return;
      }
      if (e.target === modal || e.target.closest?.('[data-admin-stats-close]'))
        close(doc);
    });
    playerModal.addEventListener('click', (e) => {
      if (e.target.closest?.('[data-admin-player-close]')) closePlayer(doc);
    });
    return true;
  }
  function autoMount() {
    if (typeof document === 'undefined') return;
    const run = () => {
      if (!mount()) root.setTimeout?.(run, 1200);
    };
    run();
    root.addEventListener?.('bizimskor:session-ready', () =>
      root.setTimeout?.(run, 300),
    );
  }
  return Object.freeze({
    render,
    renderPlayerCard,
    loadPlayerCard,
    load,
    fallback,
    mount,
    autoMount,
    open,
    close,
    openPlayer,
    closePlayer,
  });
});
