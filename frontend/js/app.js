/* =============================================================================
   GROUPER Frontend JavaScript (Milestone 3 Full-Stack Integration)
   All data fetched from real API endpoints.
   JWT stored in sessionStorage; attached as  Authorization: Bearer <token>
============================================================================= */
 
const API = 'http://localhost:5000/api';   // Change to deployed URL when hosted
 
/* STATE */
const STATE = {
  token:        sessionStorage.getItem('token') || null,
  currentUser:  JSON.parse(sessionStorage.getItem('user') || 'null'),
  searchQuery:  '',
  filterCourse: '',
  selectedGroup: null,
  vouchedIDs:   new Set(),
  activeTab:    'tab-home',
  allGroups:    [],   // cached after last GET /api/groups
};
 
/* UTILITIES  */
const $ = id => document.getElementById(id);
 
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.querySelector('.phone-frame').appendChild(t);
  setTimeout(() => t.remove(), 2700);
}
 
function slotStatus(g) {
  if (g.userCount >= g.userMax) return 'full';
  if (g.userCount / g.userMax >= 0.75) return 'warn';
  return 'open';
}
function slotBadge(g) {
  return g.userCount >= g.userMax ? 'Full' : `${g.userCount}/${g.userMax} Members`;
}
 
const AVATAR_COLORS = ['avatar-purple','avatar-teal','avatar-orange','avatar-blue'];
function avatarColor(userID) { return AVATAR_COLORS[userID % AVATAR_COLORS.length]; }
 
function showLoading(containerID, msg) {
  $(containerID).innerHTML = `<div style="padding:20px;text-align:center;color:var(--grey-3);font-size:13px;">${msg || 'Loading…'}</div>`;
}
 
// Authenticated fetch wrapper attaches JWT header, returns parsed JSON or throws
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;
  const res  = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
 
/* NAVIGATION */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(pageId).classList.add('active');
}
 
function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  $(tabId).classList.add('active');
  document.querySelectorAll('.nav-item[data-tab]').forEach(n => {
    n.classList.toggle('active', n.dataset.tab === tabId);
  });
  if (tabId === 'tab-groups')  renderMyGroups();
  if (tabId === 'tab-profile') renderProfile();
}
 
function goToMain(tab) {
  showPage('page-main');
  switchTab(tab || STATE.activeTab);
}
 
/* LOGIN */
async function doLogin() {
  const email = $('login-email').value.trim();
  const pass  = $('login-pass').value.trim();
  let ok = true;
 
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('login-email').classList.add('error');
    $('login-email-err').classList.add('show');
    ok = false;
  } else {
    $('login-email').classList.remove('error');
    $('login-email-err').classList.remove('show');
  }
  if (!pass || pass.length < 6) {
    $('login-pass').classList.add('error');
    $('login-pass-err').classList.add('show');
    ok = false;
  } else {
    $('login-pass').classList.remove('error');
    $('login-pass-err').classList.remove('show');
  }
  if (!ok) return;
 
  const btn = $('btn-login');
  btn.textContent = 'Logging in…';
  btn.disabled    = true;
 
  try {
    // POST /api/auth/login  { email, password }
    // Server bcrypt-compares password against hashPass in users table, returns JWT
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password: pass }),
    });
 
    STATE.token       = data.token;
    STATE.currentUser = data.user;
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user',  JSON.stringify(data.user));
 
    goToMain('tab-home');
    await renderFeed();
  } catch (err) {
    showToast('Login failed: ' + err.message);
  } finally {
    btn.textContent = 'Log In';
    btn.disabled    = false;
  }
}

/* SIGN UP */
function openSignup() {
  ['signup-fname','signup-lname','signup-email','signup-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('signup-year').value  = '';
  document.getElementById('signup-major').value = '';
  document.querySelectorAll('#page-signup .error-text').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('#page-signup .form-input').forEach(e => e.classList.remove('error'));
  showPage('page-signup');
}

async function doSignup() {
  const fname   = document.getElementById('signup-fname').value.trim();
  const lname   = document.getElementById('signup-lname').value.trim();
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-pass').value.trim();
  const year    = document.getElementById('signup-year').value;
  const majorID = document.getElementById('signup-major').value;
  let ok = true;

  const setErr = (id, errId, condition) => {
    const input = document.getElementById(id);
    const err   = document.getElementById(errId);
    if (condition) {
      input.classList.add('error');
      err.classList.add('show');
      ok = false;
    } else {
      input.classList.remove('error');
      err.classList.remove('show');
    }
  };

  setErr('signup-fname', 'signup-fname-err', !fname);
  setErr('signup-lname', 'signup-lname-err', !lname);
  setErr('signup-email', 'signup-email-err', !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  setErr('signup-pass',  'signup-pass-err',  !pass || pass.length < 6);
  setErr('signup-year',  'signup-year-err',  !year);
  setErr('signup-major', 'signup-major-err', !majorID);

  if (!ok) return;

  const btn        = document.getElementById('btn-signup-submit');
  const generalErr = document.getElementById('signup-general-err');
  btn.textContent  = 'Creating account…';
  btn.disabled     = true;
  generalErr.classList.remove('show');

  try {
    // POST /api/auth/register
    // schoolID hardcoded to 1 (Wilfrid Laurier University — only school seeded in DB)
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: pass,
        fname,
        lname,
        userYear: parseInt(year),
        majorID:  parseInt(majorID),
        schoolID: 1,
      }),
    });

    // Replace form with success message
    document.querySelector('#page-signup .scroll-area').innerHTML = `
      <div class="signup-success">
        <div class="signup-success-icon">🎉</div>
        <div class="signup-success-title">Account Created!</div>
        <div class="signup-success-sub">
          Welcome to Grouper, ${fname}!<br>You can now log in with your email and password.
        </div>
        <button class="btn btn-primary" onclick="showPage('page-login')">Go to Login</button>
      </div>`;
  } catch (err) {
    generalErr.textContent = err.message;
    generalErr.classList.add('show');
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled    = false;
  }
}
 
/* HOME FEED */
async function renderFeed() {
  showLoading('feed-list');
  try {
    // GET /api/groups  (optionally ?courseCode=CP476 for server-side filter)
    const params = STATE.filterCourse ? `?courseCode=${STATE.filterCourse}` : '';
    STATE.allGroups = await apiFetch(`/groups${params}`);
  } catch (err) {
    $('feed-list').innerHTML = `<div style="padding:20px;color:var(--red);font-size:13px;">Could not load groups: ${err.message}</div>`;
    return;
  }
  renderFeedFromCache();
}
 
function renderFeedFromCache() {
  const list = $('feed-list');
  let groups  = [...STATE.allGroups];
  const q     = STATE.searchQuery.toLowerCase().trim();
 
  if (q) groups = groups.filter(g =>
    g.courseCode.toLowerCase().includes(q) ||
    g.title.toLowerCase().includes(q) ||
    (g.skills || []).some(s => s.toLowerCase().includes(q))
  );
 
  if (!groups.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--grey-3);">
        <div style="font-size:36px;margin-bottom:10px;">🔍</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No groups found</div>
        <div style="font-size:13px;">Try a different search or clear filters.</div>
      </div>`;
    return;
  }
 
  list.innerHTML = groups.map(g => {
    const status = slotStatus(g);
    const tags   = (g.skills || []).slice(0,3).map(s => `<span class="tag">${s}</span>`).join('');
    return `
      <div class="group-card ${status}" data-gid="${g.groupID}">
        <div class="card-top">
          <span class="course-code">${g.courseCode}</span>
          <span class="slots-badge ${status}">${slotBadge(g)}</span>
        </div>
        <div class="card-title">${g.title}</div>
        <div class="card-desc">${g.aboutGroup || ''}</div>
        <div class="tags-row">${tags}</div>
        <button class="btn btn-outline btn-sm" style="pointer-events:none;">View Details →</button>
      </div>`;
  }).join('');
 
  list.querySelectorAll('.group-card').forEach(card => {
    card.addEventListener('click', () => openGroupDetail(parseInt(card.dataset.gid)));
  });
}
 
/* GROUP DETAIL */
async function openGroupDetail(groupID) {
  showPage('page-detail');
  $('detail-footer').innerHTML = '';
  $('detail-course-badge').textContent = '';
  $('detail-title').textContent        = '';
  $('detail-meta').innerHTML           = '';
  $('detail-desc').textContent         = '';
  $('detail-tags').innerHTML           = '';
  showLoading('detail-members');
 
  try {
    // GET /api/groups/:id
    const g = await apiFetch(`/groups/${groupID}`);
    STATE.selectedGroup = g;
 
    $('detail-course-badge').textContent = g.courseCode;
    $('detail-title').textContent        = g.title;
    $('detail-meta').innerHTML  = `<span>📅 Due: ${g.dueDate || 'TBD'}</span><span>👥 ${slotBadge(g)}</span>`;
    $('detail-desc').textContent         = g.aboutGroup || '';
    $('detail-tags').innerHTML           = (g.skills || []).map(s => `<span class="tag">${s}</span>`).join('');
 
    const members   = g.members || [];
    const openSlots = Math.max(0, g.userMax - members.length);
 
    $('detail-members').innerHTML =
      members.map(m => `
        <div class="member-item">
          <div class="avatar ${avatarColor(m.userID)}">${m.initials || m.fname[0]}</div>
          <div class="member-info">
            <span class="member-name">${m.fname} ${m.lname}</span>
            <span class="member-role">${m.role || 'Member'}</span>
          </div>
        </div>`).join('') +
      Array.from({ length: openSlots }, () => `
        <div class="member-item" style="opacity:0.45;">
          <div class="avatar avatar-empty">?</div>
          <div class="member-info"><span class="member-name">Open Slot</span></div>
        </div>`).join('');
 
    const myID         = STATE.currentUser?.userID;
    const alreadyIn    = members.some(m => m.userID === myID) || g.leaderID === myID;
 
    if (g.userCount >= g.userMax) {
      $('detail-footer').innerHTML = `<button class="btn btn-ghost" style="width:100%;" disabled>Group is Full</button>`;
    } else if (alreadyIn) {
      $('detail-footer').innerHTML = `<button class="btn btn-ghost" style="width:100%;" disabled>You're in this group</button>`;
    } else {
      $('detail-footer').innerHTML = `<button class="btn btn-primary" id="btn-open-join">Request to Join</button>`;
      $('btn-open-join').addEventListener('click', openJoinModal);
    }
  } catch (err) {
    showToast('Could not load group: ' + err.message);
    goToMain();
  }
}
 
/* JOIN MODAL */
function openJoinModal() {
  $('join-note').value = '';
  $('join-note').style.borderColor = '';
  $('join-modal').classList.add('open');
  setTimeout(() => $('join-note').focus(), 80);
}
function closeJoinModal() { $('join-modal').classList.remove('open'); }
 
async function submitJoinRequest() {
  const note = $('join-note').value.trim();
  if (!note) { $('join-note').style.borderColor = 'var(--red)'; return; }
 
  const btn = $('btn-send-req');
  btn.textContent = 'Sending…';
  btn.disabled    = true;
 
  try {
    // POST /api/requests  { groupID, message }
    await apiFetch('/requests', {
      method: 'POST',
      body:   JSON.stringify({ groupID: STATE.selectedGroup.groupID, message: note }),
    });
    closeJoinModal();
    showToast('Request sent!');
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.textContent = 'Send Request';
    btn.disabled    = false;
  }
}
 
/* MY GROUPS */
async function renderMyGroups() {
  showLoading('my-managing');
 
  try {
    // GET /api/users/me/groups
    const data = await apiFetch('/users/me/groups');
    renderMyGroupsUI(data);
  } catch (err) {
    $('my-managing').innerHTML = `<div style="color:var(--red);font-size:13px;">${err.message}</div>`;
  }
}
 
function renderMyGroupsUI({ managing, memberships, applications }) {
  // Groups I manage
  if (!managing.length) {
    $('my-managing').innerHTML = `<div style="font-size:13px;color:var(--grey-3);">You don't manage any groups yet.</div>`;
  } else {
    $('my-managing').innerHTML = managing.map(mg => {
      const membersHtml = (mg.members || []).map(m => `
        <div class="roster-row">
          <div class="avatar ${avatarColor(m.userID)}" style="width:28px;height:28px;font-size:11px;">${m.initials || m.fname[0]}</div>
          <span class="roster-name">${m.fname} ${m.lname}</span>
        </div>`).join('');
 
      const reqsHtml = (mg.requests || []).map(r => `
        <div class="req-item" id="req-${r.reqID}">
          <div>
            <div class="req-name">${r.fname} ${r.lname}</div>
            <div class="req-sub">${r.message || ''}</div>
          </div>
          <div class="req-actions">
            <button class="btn-approve" data-reqid="${r.reqID}" data-status="accepted">✔</button>
            <button class="btn-decline" data-reqid="${r.reqID}" data-status="rejected">✖</button>
          </div>
        </div>`).join('');
 
      return `
        <div class="manage-card">
          <div class="manage-card-header">
            <div>
              <div class="manage-group-name">${mg.courseCode} – ${mg.title}</div>
              <div class="manage-group-sub">Managed by you</div>
            </div>
            <span class="role-badge">Leader</span>
          </div>
          <div class="roster-label">Current Roster (${(mg.members||[]).length}/${mg.userMax})</div>
          ${membersHtml}
          ${(mg.requests||[]).length > 0
            ? `<div class="request-box">
                 <div class="req-box-header">⚠️ ${mg.requests.length} Request${mg.requests.length > 1 ? 's' : ''} Pending</div>
                 ${reqsHtml}
               </div>`
            : `<div style="font-size:12px;color:var(--grey-3);margin-top:10px;">No pending requests.</div>`}
        </div>`;
    }).join('');
 
    // Wire approve / decline buttons
    $('my-managing').querySelectorAll('[data-reqid]').forEach(btn => {
      btn.addEventListener('click', () => handleRequest(+btn.dataset.reqid, btn.dataset.status));
    });
  }
 
  // Memberships
  $('my-memberships').innerHTML = memberships.length
    ? memberships.map(g => `
        <div class="manage-card" style="border-top-color:var(--grey-4);">
          <div class="manage-card-header" style="border:none;margin:0;padding:0;">
            <div><div class="manage-group-name">${g.courseCode} – ${g.title}</div></div>
            <span class="role-badge member">Member</span>
          </div>
        </div>`).join('')
    : `<div style="font-size:13px;color:var(--grey-3);">No active memberships.</div>`;
 
  // Applications
  $('my-applications').innerHTML = applications.length
    ? applications.map(a => `
        <div class="pending-card">
          <div>
            <div class="manage-group-name">${a.courseCode} – ${a.title}</div>
            <div style="font-size:12px;color:var(--grey-3);">Waiting for leader…</div>
          </div>
          <span class="pending-status">${a.reqStatus}</span>
        </div>`).join('')
    : `<div style="font-size:13px;color:var(--grey-3);">No sent applications.</div>`;
}
 
async function handleRequest(reqID, status) {
  try {
    // PATCH /api/requests/:reqID  { status: 'accepted' | 'rejected' }
    await apiFetch(`/requests/${reqID}`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    });
    showToast(status === 'accepted' ? 'Request accepted!' : 'Request declined.');
    await renderMyGroups();   // refresh the whole section
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}
 
/* PROFILE */
async function renderProfile() {
  // Instant render from cached login data while API call completes
  if (STATE.currentUser) renderProfileUI(STATE.currentUser);
 
  try {
    // GET /api/users/me  (returns profile joined with majors + schools + skills)
    const u = await apiFetch('/users/me');
    STATE.currentUser = u;
    sessionStorage.setItem('user', JSON.stringify(u));
    renderProfileUI(u);
  } catch (err) {
    showToast('Could not refresh profile: ' + err.message);
  }
}
 
function renderProfileUI(u) {
  $('profile-initials').textContent = u.fname ? u.fname[0] : '?';
  $('profile-name').textContent     = `${u.fname} ${u.lname}`;
  $('profile-sub').textContent      = `${u.majorName || 'Student'} • Year ${u.userYear}`;
  $('vouch-score').textContent      = u.score ?? 0;
  $('profile-email').textContent    = u.email || '';
  $('profile-github').textContent   = u.github || '';
  $('profile-skills').innerHTML     = (u.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');
  $('profile-bio').textContent      = u.aboutUser || '';
}
 
/* RATE TEAMMATES */
async function renderRating() {
  showLoading('rating-list');
 
  try {
    // Pull teammates from groups I belong to
    const data      = await apiFetch('/users/me/groups');
    const seen      = new Set([STATE.currentUser?.userID]);
    const teammates = [];
 
    for (const g of [...(data.managing||[]), ...(data.memberships||[])]) {
      for (const m of (g.members || [])) {
        if (!seen.has(m.userID)) { seen.add(m.userID); teammates.push(m); }
      }
    }
 
    if (!teammates.length) {
      $('rating-list').innerHTML = `<div style="font-size:13px;color:var(--grey-3);padding:10px 0;">No teammates to rate yet.</div>`;
      return;
    }
 
    $('rating-list').innerHTML = teammates.map(t => {
      const done = STATE.vouchedIDs.has(t.userID);
      return `
        <div class="rate-card">
          <div class="rate-avatar ${avatarColor(t.userID)}">${t.initials || t.fname[0]}</div>
          <div class="rate-info">
            <span class="rate-name">${t.fname} ${t.lname}</span>
            <span class="rate-role">${t.role || 'Member'}</span>
          </div>
          <button class="btn-vouch ${done ? 'vouched' : ''}"
                  data-uid="${t.userID}" data-name="${t.fname}" ${done ? 'disabled' : ''}>
            ${done ? '<span>✔</span> Vouched' : '<span>👍</span> Vouch'}
          </button>
        </div>`;
    }).join('');
 
    $('rating-list').querySelectorAll('.btn-vouch:not(.vouched)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid  = +btn.dataset.uid;
        const name =  btn.dataset.name;
        if (STATE.vouchedIDs.has(uid)) return;
        try {
          // POST /api/users/:uid/vouch
          await apiFetch(`/users/${uid}/vouch`, { method: 'POST' });
          STATE.vouchedIDs.add(uid);
          showToast(`You vouched for ${name}!`);
          renderRating();
        } catch (err) {
          showToast('Error: ' + err.message);
        }
      });
    });
  } catch (err) {
    $('rating-list').innerHTML = `<div style="color:var(--red);font-size:13px;">${err.message}</div>`;
  }
}
 
/* CREATE LISTING */
let createTags = [];
 
function renderTagChips() {
  const wrap  = $('tag-input-wrap');
  const typer = $('tag-typer');
  wrap.querySelectorAll('.tag-chip').forEach(c => c.remove());
  createTags.forEach((tag, idx) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${tag} <span class="tag-chip-remove" data-idx="${idx}">×</span>`;
    wrap.insertBefore(chip, typer);
  });
  wrap.querySelectorAll('.tag-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => { createTags.splice(+btn.dataset.idx, 1); renderTagChips(); });
  });
}
 
function openCreateListing() {
  $('create-course').value         = '';
  $('create-title').value          = '';
  $('create-desc').value           = '';
  $('create-size-val').textContent = '4';
  $('create-course').classList.remove('error');
  $('create-title').classList.remove('error');
  $('create-course-err').classList.remove('show');
  $('create-title-err').classList.remove('show');
  $('create-course-err').textContent = 'Please enter a valid course code (e.g. CP476).';
  createTags = [];
  renderTagChips();
  showPage('page-create');
}
 
async function submitCreateListing() {
  const code  = $('create-course').value.trim().toUpperCase();
  const title = $('create-title').value.trim();
  const desc  = $('create-desc').value.trim();
  const size  = +$('create-size-val').textContent;
  let ok      = true;
 
  if (!/^[A-Z]{2}\d{3}$/.test(code)) {
    $('create-course-err').classList.add('show'); $('create-course').classList.add('error'); ok = false;
  } else {
    $('create-course-err').classList.remove('show'); $('create-course').classList.remove('error');
  }
  if (!title) {
    $('create-title-err').classList.add('show'); $('create-title').classList.add('error'); ok = false;
  } else {
    $('create-title-err').classList.remove('show'); $('create-title').classList.remove('error');
  }
  if (!ok) return;
 
  // Validate course code exists in DB and get its courseInstanceID
  let courseInstanceID = null;
  try {
    const courses = await apiFetch(`/courses/${code}`);
    courseInstanceID = courses[0]?.courseInstanceID;
  } catch {
    $('create-course-err').textContent = 'Course code not found in system.';
    $('create-course-err').classList.add('show');
    $('create-course').classList.add('error');
    return;
  }
 
  const btn = $('btn-post-create');
  btn.textContent = 'Posting…';
  btn.disabled    = true;
 
  try {
    // POST /api/groups  { title, aboutGroup, userMax, dueDate, courseInstanceID }
    await apiFetch('/groups', {
      method: 'POST',
      body: JSON.stringify({
        title,
        aboutGroup:       desc || null,
        userMax:          size,
        dueDate:          '2026-04-30',
        courseInstanceID,
      }),
    });
    goToMain('tab-home');
    await renderFeed();
    showToast('Listing posted!');
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.textContent = 'Post';
    btn.disabled    = false;
  }
}
 
/* INIT */
document.addEventListener('DOMContentLoaded', () => {
 
  // If already logged in from a previous session, skip login screen
  if (STATE.token && STATE.currentUser) {
    goToMain('tab-home');
    renderFeed();
  }
 
  // Login
  $('btn-login').addEventListener('click', doLogin);
  $('btn-register').addEventListener('click', openSignup);
  $('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  $('login-pass').addEventListener('keydown',  e => { if (e.key === 'Enter') doLogin(); });
  $('btn-back-signup').addEventListener('click', () => showPage('page-login'));
  $('btn-signup-submit').addEventListener('click', doSignup);
 
  // Bottom nav
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', () => { showPage('page-main'); switchTab(item.dataset.tab); });
  });
 
  // Search — client-side filter on cached group list, no extra API call
  $('search-input').addEventListener('input', e => {
    STATE.searchQuery = e.target.value;
    renderFeedFromCache();
  });
 
  // Filter
  $('btn-filter').addEventListener('click', () => { $('filter-panel').classList.toggle('open'); });
  $('btn-filter-apply').addEventListener('click', async () => {
    STATE.filterCourse = $('filter-course-input').value.trim().toUpperCase();
    $('filter-panel').classList.remove('open');
    await renderFeed();   // re-fetch with courseCode query param
  });
  $('btn-filter-clear').addEventListener('click', async () => {
    STATE.filterCourse = '';
    $('filter-course-input').value = '';
    $('filter-panel').classList.remove('open');
    await renderFeed();
  });
 
  // Bell / notifications
  $('btn-bell').addEventListener('click', e => { e.stopPropagation(); $('notif-panel').classList.toggle('open'); });
  $('notif-req-item').addEventListener('click', () => {
    $('notif-panel').classList.remove('open');
    goToMain('tab-groups');
  });
  document.addEventListener('click', e => {
    if (!$('notif-panel').contains(e.target) && e.target !== $('btn-bell'))
      $('notif-panel').classList.remove('open');
  });
 
  // FAB → create listing
  $('btn-create').addEventListener('click', openCreateListing);
 
  // Back buttons
  $('btn-back-detail').addEventListener('click', () => goToMain());
  $('btn-back-rating').addEventListener('click', () => goToMain());
 
  // Join modal
  $('btn-send-req').addEventListener('click', submitJoinRequest);
  $('btn-cancel-req').addEventListener('click', closeJoinModal);
 
  // Create listing
  $('btn-cancel-create').addEventListener('click', () => goToMain());
  $('btn-post-create').addEventListener('click', submitCreateListing);
  $('btn-size-dec').addEventListener('click', () => {
    const el = $('create-size-val'); el.textContent = Math.max(2, +el.textContent - 1);
  });
  $('btn-size-inc').addEventListener('click', () => {
    const el = $('create-size-val'); el.textContent = Math.min(10, +el.textContent + 1);
  });
  $('tag-input-wrap').addEventListener('click', () => $('tag-typer').focus());
  $('tag-typer').addEventListener('keydown', e => {
    const val = $('tag-typer').value.trim().replace(/,/g, '');
    if ((e.key === 'Enter' || e.key === ',') && val) {
      e.preventDefault();
      if (!createTags.includes(val)) { createTags.push(val); renderTagChips(); }
      $('tag-typer').value = '';
    } else if (e.key === 'Backspace' && !$('tag-typer').value && createTags.length) {
      createTags.pop(); renderTagChips();
    }
  });
 
  // Rate teammates
  $('btn-rate-groups').addEventListener('click',  () => { renderRating(); showPage('page-rating'); });
  $('btn-rate-profile').addEventListener('click', () => { renderRating(); showPage('page-rating'); });
 
  // Settings
  $('btn-settings').addEventListener('click', e => {
    e.stopPropagation();
    $('settings-panel').classList.add('open');
  });
  $('settings-panel').addEventListener('click', e => {
    if (e.target === $('settings-panel')) $('settings-panel').classList.remove('open');
  });
  document.querySelectorAll('.settings-stub').forEach(row => {
    row.addEventListener('click', () => {
      $('settings-panel').classList.remove('open');
      showToast('Coming soon!');
    });
  });
  $('btn-logout').addEventListener('click', () => {
    STATE.token       = null;
    STATE.currentUser = null;
    STATE.allGroups   = [];
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    $('settings-panel').classList.remove('open');
    $('login-email').value = '';
    $('login-pass').value  = '';
    showPage('page-login');
    showToast('Logged out.');
  });
 
});
