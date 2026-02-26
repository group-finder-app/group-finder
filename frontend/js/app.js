/* =========================================
   GROUPER — Main JavaScript
   Mock data aligned to backend API structure
   API base: /api/  (auth, users, groups, courses, requests)
   ========================================= */

'use strict';

// MOCK DATA  (mirrors backend DB schema from Phase 1)

const MOCK = {
  currentUser: {
    userID: 1,
    firstName: 'Drake',
    lastName: 'Martin',
    email: 'mart3490@mylaurier.ca',
    year: 4,
    major: 'Computer Science',
    score: 18,
    about: "I'm a senior CS student focusing on full-stack web development. I have experience with MERN stack and I'm looking for a group for CP476 that aims for an A+.\n\nAvailable on weekends and Tuesday/Thursday evenings.",
    github: 'github.com/dmartin',
    skills: ['Python', 'JavaScript', 'React.js', 'SQL', 'Figma'],
  },

  groups: [
    {
      groupID: 1,
      title: 'Web Dev Project: E-Commerce',
      description: 'Looking for a frontend developer familiar with React and Tailwind. We have backend covered.',
      courseCode: 'CP476',
      userCount: 2,
      userMax: 4,
      dueDate: 'Apr 10',
      skills: ['JavaScript', 'React', 'Tailwind CSS'],
      leader: { userID: 2, firstName: 'Paul', lastName: 'Matsialko', role: 'Backend' },
      members: [
        { userID: 2, firstName: 'Paul',  lastName: 'Matsialko', role: 'Leader • Backend',   initials: 'P', color: 'avatar-purple' },
        { userID: 3, firstName: 'Kyler', lastName: 'Smart',     role: 'Member • Database',  initials: 'K', color: 'avatar-teal' },
      ],
    },
    {
      groupID: 2,
      title: 'Software Engineering – SRS Docs',
      description: 'Need one more person for documentation and QA testing. Easy going group.',
      courseCode: 'CP317',
      userCount: 3,
      userMax: 4,
      dueDate: 'Mar 20',
      skills: ['Jira', 'Testing', 'Documentation'],
      leader: { userID: 4, firstName: 'Alex', lastName: 'Thompson', role: 'Leader' },
      members: [
        { userID: 4, firstName: 'Alex',  lastName: 'Thompson', role: 'Leader',          initials: 'A', color: 'avatar-blue' },
        { userID: 5, firstName: 'Sara',  lastName: 'Nguyen',   role: 'Member • QA',     initials: 'S', color: 'avatar-orange' },
        { userID: 6, firstName: 'Liam',  lastName: 'Chen',     role: 'Member • Docs',   initials: 'L', color: 'avatar-purple' },
      ],
    },
    {
      groupID: 3,
      title: 'Database Design Project',
      description: 'Full group established. Just posting for visibility.',
      courseCode: 'CP363',
      userCount: 4,
      userMax: 4,
      dueDate: 'Mar 28',
      skills: ['SQL', 'PHP', 'MySQL'],
      leader: { userID: 7, firstName: 'Mia', lastName: 'Park', role: 'Leader' },
      members: [
        { userID: 7, firstName: 'Mia',  lastName: 'Park',   role: 'Leader',   initials: 'M', color: 'avatar-teal' },
        { userID: 8, firstName: 'Tom',  lastName: 'Davis',  role: 'Member',   initials: 'T', color: 'avatar-orange' },
        { userID: 9, firstName: 'Nina', lastName: 'Reyes',  role: 'Member',   initials: 'N', color: 'avatar-blue' },
        { userID: 10,firstName: 'Jake', lastName: 'Wilson', role: 'Member',   initials: 'J', color: 'avatar-purple' },
      ],
    },
    {
      groupID: 4,
      title: 'Intro to Programming – Study Group',
      description: 'First year student looking for partners to study with and tackle assignments together.',
      courseCode: 'CP104',
      userCount: 1,
      userMax: 3,
      dueDate: 'Ongoing',
      skills: ['Python'],
      leader: { userID: 11, firstName: 'Priya', lastName: 'Kumar', role: 'Leader' },
      members: [
        { userID: 11, firstName: 'Priya', lastName: 'Kumar', role: 'Leader', initials: 'P', color: 'avatar-orange' },
      ],
    },
  ],

  // Groups the current user manages or belongs to
  myGroups: {
    managing: [
      {
        groupID: 5,
        title: 'Project Grouper',
        courseCode: 'CP476',
        userCount: 2,
        userMax: 4,
        members: [
          { userID: 1, firstName: 'Drake', lastName: 'Martin', initials: 'D', color: 'avatar-teal' },
          { userID: 3, firstName: 'Josh',  lastName: 'Gelbaum',initials: 'J', color: 'avatar-purple' },
        ],
        requests: [
          { reqID: 1, userID: 12, name: 'Kyler Smart',    message: '"I know backend dev!"' },
          { reqID: 2, userID: 13, name: 'Paul Matsialko', message: 'Year 4 Student' },
        ],
      },
    ],
    memberships: [
      { groupID: 2, courseCode: 'CP317', title: 'SRS Documentation Team' },
    ],
    applications: [
      { groupID: 3, courseCode: 'CP363', title: 'Waiting for leader...', status: 'pending' },
    ],
  },

  teammates: [
    { userID: 3, firstName: 'Josh',  lastName: 'Gelbaum',   role: 'Frontend Dev',       initials: 'J', color: 'avatar-blue',   vouched: false },
    { userID: 4, firstName: 'Kyler', lastName: 'Smart',     role: 'Database Architect', initials: 'K', color: 'avatar-teal',   vouched: true  },
    { userID: 5, firstName: 'Paul',  lastName: 'Matsialko', role: 'Project Lead',       initials: 'P', color: 'avatar-orange', vouched: false },
  ],
};

// STATE
const STATE = {
  activeTab: 'home',          // home | groups | profile
  selectedGroup: null,        // group object currently viewed
  searchQuery: '',
  filterActive: false,
  filterCourse: '',
  myGroupsRequestMap: {},     // reqID -> removed (for UI)
  vouchedIDs: new Set(MOCK.teammates.filter(t => t.vouched).map(t => t.userID)),
  currentUserScore: MOCK.currentUser.score,
};

// UTILITIES
const $ = id => document.getElementById(id);
const showToast = (msg) => {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.querySelector('.phone-frame').appendChild(t);
  setTimeout(() => t.remove(), 2600);
};

function getSlotStatus(group) {
  const pct = group.userCount / group.userMax;
  if (group.userCount >= group.userMax) return 'full';
  if (pct >= 0.75) return 'warn';
  return 'open';
}

function getSlotBadgeText(group) {
  if (group.userCount >= group.userMax) return 'Full';
  return `${group.userCount}/${group.userMax} Members`;
}

function getSlotBadgeClass(group) {
  if (group.userCount >= group.userMax) return 'full';
  if (group.userCount / group.userMax >= 0.75) return 'warn';
  return 'open';
}

// NAVIGATION
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  STATE.activeTab = page;
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    target.classList.add('fade-in');
    setTimeout(() => target.classList.remove('fade-in'), 300);
  }
}

// HOME FEED
function renderFeed() {
  const container = $('feed-list');
  const query = STATE.searchQuery.toLowerCase().trim();
  const filterCourse = STATE.filterCourse.toUpperCase().trim();

  let groups = [...MOCK.groups];

  if (query) {
    groups = groups.filter(g =>
      g.courseCode.toLowerCase().includes(query) ||
      g.title.toLowerCase().includes(query) ||
      g.skills.some(s => s.toLowerCase().includes(query))
    );
  }

  if (filterCourse) {
    groups = groups.filter(g => g.courseCode.toUpperCase() === filterCourse);
  }

  if (groups.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--grey-3);">
        <div style="font-size:36px; margin-bottom:10px;">🔍</div>
        <div style="font-size:15px; font-weight:600; margin-bottom:6px;">No groups found</div>
        <div style="font-size:13px;">Try a different search or clear your filters.</div>
      </div>`;
    return;
  }

  container.innerHTML = groups.map(g => {
    const status = getSlotStatus(g);
    const badgeText = getSlotBadgeText(g);
    const badgeClass = getSlotBadgeClass(g);
    const tagsHtml = g.skills.slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('');
    return `
      <div class="group-card ${status}" onclick="openGroupDetail(${g.groupID})">
        <div class="card-top">
          <span class="course-code">${g.courseCode}</span>
          <span class="slots-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="card-title">${g.title}</div>
        <div class="card-desc">${g.description}</div>
        <div class="tags-row">${tagsHtml}</div>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openGroupDetail(${g.groupID})">View Details</button>
      </div>`;
  }).join('');
}

function openGroupDetail(groupID) {
  const group = MOCK.groups.find(g => g.groupID === groupID);
  if (!group) return;
  STATE.selectedGroup = group;
  renderGroupDetail(group);
  navigateTo('detail');
}

// GROUP DETAIL
function renderGroupDetail(group) {
  const isFull = group.userCount >= group.userMax;
  const badgeText = getSlotBadgeText(group);
  const badgeClass = getSlotBadgeClass(group);

  $('detail-course-badge').textContent = group.courseCode;
  $('detail-title').textContent = group.title;
  $('detail-meta').innerHTML = `<span> Due: ${group.dueDate}</span><span>👥 ${badgeText}</span>`;
  $('detail-desc').textContent = group.description;
  $('detail-tags').innerHTML = group.skills.map(s => `<span class="tag">${s}</span>`).join('');

  // Members list
  const slots = group.userMax - group.members.length;
  let membersHtml = group.members.map(m => `
    <div class="member-item">
      <div class="avatar ${m.color}">${m.initials}</div>
      <div class="member-info">
        <span class="member-name">${m.firstName} ${m.lastName}</span>
        <span class="member-role">${m.role}</span>
      </div>
    </div>`).join('');

  for (let i = 0; i < slots; i++) {
    membersHtml += `
      <div class="member-item" style="opacity:0.45;">
        <div class="avatar avatar-empty">?</div>
        <div class="member-info"><span class="member-name">Open Slot</span></div>
      </div>`;
  }
  $('detail-members').innerHTML = membersHtml;

  // Join button
  const footer = $('detail-footer');
  if (isFull) {
    footer.innerHTML = `<button class="btn btn-ghost" style="width:100%;" disabled>Group is Full</button>`;
  } else {
    footer.innerHTML = `<button class="btn btn-primary" onclick="openJoinModal()">Request to Join</button>`;
  }
}

// JOIN REQUEST MODAL
function openJoinModal() {
  $('join-modal').style.display = 'flex';
  $('join-note').value = '';
  $('join-note').focus();
}

function closeJoinModal() {
  $('join-modal').style.display = 'none';
}

function submitJoinRequest() {
  const note = $('join-note').value.trim();
  if (!note) {
    $('join-note').focus();
    $('join-note').style.borderColor = 'var(--red)';
    setTimeout(() => $('join-note').style.borderColor = '', 1500);
    return;
  }

  // later on... POST /api/requests { groupID, message: note }
  closeJoinModal();
  showToast(' Request sent!');

  // Update application state
  const group = STATE.selectedGroup;
  if (group) {
    MOCK.myGroups.applications.push({
      groupID: group.groupID,
      courseCode: group.courseCode,
      title: group.title,
      status: 'pending',
    });
  }
}

// MY GROUPS
function renderMyGroups() {
  // --- Groups I Manage ---
  const managingContainer = $('my-managing');
  managingContainer.innerHTML = MOCK.myGroups.managing.map(g => {
    const membersHtml = g.members.map(m => `
      <div class="roster-row">
        <div class="avatar ${m.color}" style="width:28px;height:28px;font-size:11px;">${m.initials}</div>
        <span class="roster-name">${m.firstName} ${m.lastName}</span>
      </div>`).join('');

    const requestsHtml = g.requests
      .filter(r => !STATE.myGroupsRequestMap[r.reqID])
      .map(r => `
        <div class="req-item" id="req-${r.reqID}">
          <div>
            <div class="req-name">${r.name}</div>
            <div class="req-sub">${r.message}</div>
          </div>
          <div class="req-actions">
            <button class="btn-approve" onclick="handleRequest(${r.reqID}, 'approve', '${r.name}')">✔</button>
            <button class="btn-decline" onclick="handleRequest(${r.reqID}, 'decline', '${r.name}')">✖</button>
          </div>
        </div>`).join('');

    const pendingCount = g.requests.filter(r => !STATE.myGroupsRequestMap[r.reqID]).length;

    return `
      <div class="manage-card">
        <div class="manage-card-header">
          <div>
            <div class="manage-group-name">${g.courseCode} – ${g.title}</div>
            <div class="manage-group-sub">Project ${g.title}</div>
          </div>
          <span class="role-badge">Leader</span>
        </div>
        <div class="roster-label">Current Roster (${g.userCount}/${g.userMax})</div>
        ${membersHtml}
        ${pendingCount > 0 ? `
          <div class="request-box" id="req-box-${g.groupID}">
            <div class="req-box-header"> ${pendingCount} Request${pendingCount > 1 ? 's' : ''} Pending</div>
            ${requestsHtml}
          </div>` : `<div style="font-size:12px;color:var(--grey-3);margin-top:10px;">No pending requests.</div>`}
      </div>`;
  }).join('');

  // --- Active Memberships ---
  const membershipContainer = $('my-memberships');
  membershipContainer.innerHTML = MOCK.myGroups.memberships.map(g => `
    <div class="manage-card" style="border-top-color:var(--grey-4);">
      <div class="manage-card-header" style="border:none;margin:0;padding:0;">
        <div>
          <div class="manage-group-name">${g.courseCode} – ${g.title}</div>
        </div>
        <span class="role-badge member">Member</span>
      </div>
    </div>`).join('');

  // --- Sent Applications ---
  const appsContainer = $('my-applications');
  if (MOCK.myGroups.applications.length === 0) {
    appsContainer.innerHTML = `<div style="font-size:13px;color:var(--grey-3);">No pending applications.</div>`;
  } else {
    appsContainer.innerHTML = MOCK.myGroups.applications.map(a => `
      <div class="pending-card">
        <div>
          <div class="manage-group-name">${a.courseCode} – ${a.title}</div>
          <div style="font-size:12px;color:var(--grey-3);">Waiting for leader...</div>
        </div>
        <span class="pending-status">Pending</span>
      </div>`).join('');
  }
}

function handleRequest(reqID, action, name) {
  // In production: PATCH /api/requests/:reqID  { status: 'accepted' | 'rejected' }
  STATE.myGroupsRequestMap[reqID] = action;
  const msg = action === 'approve' ? ` ${name} added to your group!` : `✖ ${name} declined.`;
  showToast(msg);
  renderMyGroups();
}

// PROFILE
function renderProfile() {
  const u = MOCK.currentUser;
  $('profile-name').textContent = `${u.firstName} ${u.lastName}`;
  $('profile-sub').textContent = `${u.major} • Year ${u.year}`;
  $('profile-initials').textContent = u.firstName[0];
  $('vouch-score').textContent = STATE.currentUserScore;
  $('profile-email').textContent = u.email;
  $('profile-github').textContent = u.github;

  $('profile-skills').innerHTML = u.skills.map(s =>
    `<span class="skill-tag">${s}</span>`
  ).join('');

  $('profile-bio').textContent = u.about;
}

// USER RATING / VOUCH
function renderRating() {
  const container = $('rating-list');
  container.innerHTML = MOCK.teammates.map(t => {
    const isVouched = STATE.vouchedIDs.has(t.userID);
    return `
      <div class="rate-card">
        <div class="rate-avatar ${t.color}">${t.initials}</div>
        <div class="rate-info">
          <span class="rate-name">${t.firstName} ${t.lastName}</span>
          <span class="rate-role">${t.role}</span>
        </div>
        <button class="btn-vouch ${isVouched ? 'vouched' : ''}" onclick="vouchUser(${t.userID}, '${t.firstName}')">
          ${isVouched ? '<span>✔</span> Vouched' : '<span>👍</span> Vouch'}
        </button>
      </div>`;
  }).join('');
}

function vouchUser(userID, name) {
  if (STATE.vouchedIDs.has(userID)) return;
  // later on... POST /api/users/:userID/vouch
  STATE.vouchedIDs.add(userID);
  showToast(`You vouched for ${name}!`);
  renderRating();
}

// CREATE LISTING
function openCreateListing() {
  navigateTo('create');
  $('create-course').value = '';
  $('create-title').value = '';
  $('create-desc').value = '';
  $('create-size-val').textContent = '4';
  $('create-course-err').classList.remove('show');
  $('create-title-err').classList.remove('show');
  clearTagChips();
}

let createTags = ['React', 'Node.js'];

function renderTagChips() {
  const wrap = $('tag-input-wrap');
  const typer = $('tag-typer');
  wrap.innerHTML = '';
  createTags.forEach((tag, idx) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${tag} <span class="tag-chip-remove" onclick="removeTag(${idx})">×</span>`;
    wrap.appendChild(chip);
  });
  wrap.appendChild(typer);
}

function clearTagChips() {
  createTags = [];
  renderTagChips();
}

function removeTag(idx) {
  createTags.splice(idx, 1);
  renderTagChips();
}

function setupTagInput() {
  const typer = $('tag-typer');
  if (!typer) return;
  typer.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && typer.value.trim()) {
      e.preventDefault();
      const val = typer.value.trim().replace(',', '');
      if (val && !createTags.includes(val)) {
        createTags.push(val);
        renderTagChips();
      } else {
        typer.value = '';
      }
    } else if (e.key === 'Backspace' && !typer.value && createTags.length) {
      createTags.pop();
      renderTagChips();
    }
  });
}

function stepSize(delta) {
  const el = $('create-size-val');
  let val = parseInt(el.textContent) + delta;
  val = Math.max(2, Math.min(10, val));
  el.textContent = val;
}

function submitCreateListing() {
  let valid = true;

  const courseCode = $('create-course').value.trim().toUpperCase();
  const title = $('create-title').value.trim();
  const desc = $('create-desc').value.trim();
  const size = parseInt($('create-size-val').textContent);

  // Validate course code (basic pattern: 2 letters + 3 digits)
  if (!/^[A-Z]{2}\d{3}$/.test(courseCode)) {
    $('create-course-err').classList.add('show');
    $('create-course').classList.add('error');
    valid = false;
  } else {
    $('create-course-err').classList.remove('show');
    $('create-course').classList.remove('error');
  }

  if (!title) {
    $('create-title-err').classList.add('show');
    $('create-title').classList.add('error');
    valid = false;
  } else {
    $('create-title-err').classList.remove('show');
    $('create-title').classList.remove('error');
  }

  if (!valid) return;

  // ;ater on... POST /api/groups { courseCode, title, description: desc, userMax: size, skills: createTags }
  const newGroup = {
    groupID: MOCK.groups.length + 100,
    title,
    description: desc || 'No description provided.',
    courseCode,
    userCount: 1,
    userMax: size,
    dueDate: 'TBD',
    skills: [...createTags],
    leader: { ...MOCK.currentUser },
    members: [
      { userID: MOCK.currentUser.userID, firstName: MOCK.currentUser.firstName, lastName: MOCK.currentUser.lastName, role: 'Leader', initials: MOCK.currentUser.firstName[0], color: 'avatar-teal' }
    ],
  };
  MOCK.groups.unshift(newGroup);

  showToast('Listing posted!');
  navigateTo('home');
  renderFeed();
}

// LOGIN
function handleLogin() {
  const email = $('login-email').value.trim();
  const pass  = $('login-pass').value.trim();
  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('login-email').classList.add('error');
    $('login-email-err').classList.add('show');
    valid = false;
  } else {
    $('login-email').classList.remove('error');
    $('login-email-err').classList.remove('show');
  }

  if (!pass || pass.length < 6) {
    $('login-pass').classList.add('error');
    $('login-pass-err').classList.add('show');
    valid = false;
  } else {
    $('login-pass').classList.remove('error');
    $('login-pass-err').classList.remove('show');
  }

  if (!valid) return;

  // later on... POST /api/auth/login { email, password: pass }
  // For now, navigate to home
  navigateTo('main');
  navigate('home');
  renderFeed();
}

function handleRegister() {
  showToast('Check your university email to verify your account.');
}

// FILTER
function toggleFilter() {
  const panel = $('filter-panel');
  STATE.filterActive = !STATE.filterActive;
  panel.style.display = STATE.filterActive ? 'block' : 'none';
  document.querySelector('.filter-btn').classList.toggle('active', STATE.filterActive);
}

function applyFilter() {
  STATE.filterCourse = $('filter-course-input').value.trim().toUpperCase();
  toggleFilter();
  renderFeed();
}

function clearFilter() {
  STATE.filterCourse = '';
  $('filter-course-input').value = '';
  toggleFilter();
  renderFeed();
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  // Bottom nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigate(page);
      if (page === 'groups') renderMyGroups();
      if (page === 'profile') renderProfile();
    });
  });

  // Login form
  $('login-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  $('login-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  // Search
  $('search-input')?.addEventListener('input', e => {
    STATE.searchQuery = e.target.value;
    renderFeed();
  });

  // Tag chips setup
  setupTagInput();
  renderTagChips();

  // Start on login screen
  navigateTo('login');
});
