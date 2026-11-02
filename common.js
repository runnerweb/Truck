/* ===== 용차 매칭 - 공통 스크립트 ===== */

// ⚠️ Apps Script 웹앱 배포 후 나오는 URL 로 교체하세요. (이 파일 한 곳만 수정하면 전체 페이지에 적용)
const API_URL = "https://script.google.com/macros/s/AKfycbwe0gbhezo1AKRVu_X8B9rwXS_MA2DAnm3k4GAf9BZXMgdeK59dhjF2KMw-aIbTiN4O9w/exec";

const TOKEN_KEY = 'yc_token';
const USER_KEY = 'yc_user';
const POLL_MS = 30000;

/* ---------- 저장소/세션 ---------- */
function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }
function getToken(){ return lsGet(TOKEN_KEY) || ''; }
function getUser(){ try { return JSON.parse(lsGet(USER_KEY) || 'null'); } catch(e){ return null; } }
function setSession(token, user){ lsSet(TOKEN_KEY, token); lsSet(USER_KEY, JSON.stringify(user)); }
function clearSession(){ lsDel(TOKEN_KEY); lsDel(USER_KEY); }
function requireLogin(){
  if(!getToken()){ location.replace('login.html'); return false; }
  return true;
}

/* ---------- API ---------- */
async function api(action, data){
  if(API_URL.indexOf('PASTE_') === 0) throw new Error('common.js 의 API_URL 을 설정하세요.');
  let res;
  try {
    res = await fetch(API_URL, { method:'POST', body: JSON.stringify(Object.assign({ action: action, token: getToken() }, data || {})) });
  } catch(e){
    throw new Error('서버와 통신 중 오류가 발생했습니다. 네트워크를 확인하세요.');
  }
  let json;
  try { json = await res.json(); } catch(e){
    throw new Error('서버 응답을 읽을 수 없습니다. API_URL/배포 설정을 확인하세요.');
  }
  if(json.ok) return json;
  if(json.code === 'AUTH'){ clearSession(); location.replace('login.html'); }
  const err = new Error(json.message || '요청에 실패했습니다.');
  err.code = json.code;
  throw err;
}

/* ---------- 유틸 ---------- */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function won(n){ return Number(n || 0).toLocaleString('ko-KR') + '원'; }
const DOW = ['일','월','화','수','목','금','토'];
function pad(n){ return String(n).padStart(2,'0'); }
function ymd(d){ return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
function todayStr(){ return ymd(new Date()); }
function parseYmd(s){ const p = s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
function kdate(s){ const d = parseYmd(s); return (d.getMonth()+1) + '월 ' + d.getDate() + '일(' + DOW[d.getDay()] + ')'; }
function shortDate(s){ const d = parseYmd(s); return (d.getMonth()+1) + '/' + d.getDate() + '(' + DOW[d.getDay()] + ')'; }
function fmtTime(s){ // 'yyyy-MM-dd HH:mm:ss' -> 'M/d HH:mm'
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(s || '');
  return m ? (Number(m[2]) + '/' + Number(m[3]) + ' ' + m[4] + ':' + m[5]) : '';
}
function shiftTag(s){
  const night = (s || '주간') === '야간';
  return '<span class="tag" style="background:' + (night ? '#1E2E4D;color:#fff' : '#FBF1DC;color:#C6852A') + '">' + (night ? '야간' : '주간') + '</span>';
}
function telLink(p){ return p ? '<a class="tel" href="tel:' + esc(String(p).replace(/[^0-9]/g,'')) + '">' + esc(p) + '</a>' : '-'; }

const ICON = {
  back:'<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>'
};

/* ---------- 토스트 / 모달 ---------- */
function toast(msg, type, onClick){
  let box = document.getElementById('toastBox');
  if(!box){ box = document.createElement('div'); box.id = 'toastBox'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  if(onClick){ t.style.cursor = 'pointer'; t.onclick = onClick; }
  box.appendChild(t);
  setTimeout(function(){ t.classList.add('hide'); setTimeout(function(){ t.remove(); }, 300); }, 3800);
}
function closeModal(){ const b = document.getElementById('modalBack'); if(b) b.remove(); }
function openModal(html, sticky){
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.id = 'modalBack';
  back.innerHTML = '<div class="modal">' + html + '</div>';
  back.addEventListener('click', function(e){ if(e.target === back && !sticky) closeModal(); });
  document.body.appendChild(back);
  return back.firstChild;
}
function confirmModal(title, msg, okText){
  return new Promise(function(resolve){
    const m = openModal('<h3>' + esc(title) + '</h3><p class="muted" style="margin:6px 0 0;font-size:14px;white-space:pre-line">' + esc(msg) +
      '</p><div class="m-actions"><button class="btn btn-ghost" data-v="0">취소</button><button class="btn btn-primary" data-v="1">' + esc(okText || '확인') + '</button></div>');
    m.addEventListener('click', function(e){
      const b = e.target.closest('[data-v]'); if(!b) return;
      closeModal(); resolve(b.dataset.v === '1');
    });
    document.getElementById('modalBack').addEventListener('click', function(e){ if(e.target.id === 'modalBack') resolve(false); });
  });
}

/* ---------- 상단 바 + 알림 폴링 ---------- */
function setBadge(n){
  const b = document.getElementById('bellBadge');
  if(!b) return;
  b.textContent = n > 99 ? '99+' : n;
  b.hidden = !(n > 0);
}

function renderAppbar(opts){
  opts = opts || {};
  const bar = document.createElement('header');
  bar.className = 'appbar';
  bar.innerHTML =
    (opts.back ? '<button class="icon-btn" id="abBack" aria-label="뒤로">' + ICON.back + '</button>' : '') +
    '<div class="ab-title">' + esc(opts.title || '용차 매칭') + '</div>' +
    '<a class="icon-btn" href="notifications.html" aria-label="알림">' + ICON.bell + '<span class="badge" id="bellBadge" hidden>0</span></a>' +
    '<button class="icon-btn" id="abMenu" aria-label="메뉴">' + ICON.more + '</button>';
  document.body.insertBefore(bar, document.body.firstChild);

  if(opts.back){
    document.getElementById('abBack').onclick = function(){
      if(typeof opts.onBack === 'function') opts.onBack();
      else location.href = (typeof opts.back === 'string') ? opts.back : 'home.html';
    };
  }
  document.getElementById('abMenu').onclick = openMenu;
  startNotiPolling();
}

function openMenu(){
  const u = getUser() || {};
  const m = openModal(
    '<h3>' + esc(u.name || '') + ' <span class="muted small">@' + esc(u.id || '') + '</span></h3>' +
    '<div class="muted small" style="margin-top:6px">' + esc(u.camp || '') + ' · ' + esc(u.route || '') + '</div>' +
    '<div class="m-actions" style="flex-direction:column">' +
    '<a class="btn btn-ghost" href="home.html">홈</a>' +
    '<a class="btn btn-ghost" href="schedule.html">내 스케줄</a>' +
    '<button class="btn btn-danger" id="logoutBtn">로그아웃</button></div>');
  m.querySelector('#logoutBtn').onclick = async function(){
    try { await api('logout'); } catch(e){}
    clearSession();
    location.replace('login.html');
  };
}

let _pollTimer = null;
function startNotiPolling(){
  if(_pollTimer) return;
  let last = null;
  async function tick(){
    if(document.hidden) return;
    try {
      const r = await api('unread');
      setBadge(r.unread);
      if(last === null){
        if(r.unread > 0 && !/notifications\.html/.test(location.pathname)){
          toast('읽지 않은 알림 ' + r.unread + '건', '', function(){ location.href = 'notifications.html'; });
        }
      } else if(r.unread > last){
        const n = await api('notifications');
        const item = (n.items || []).filter(function(i){ return !i.read; })[0];
        if(item) showNotiPopup(item);
        window.dispatchEvent(new Event('yc:noti-changed'));
      }
      last = r.unread;
    } catch(e){}
  }
  tick();
  _pollTimer = setInterval(tick, POLL_MS);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick(); });
}

/* ---------- 알림 팝업 / 수락·거절 / 매칭 완료 화면 ---------- */
async function respondTo(rid, accept){
  try {
    await api('respond', { rid: rid, accept: !!accept });
    toast(accept ? '수락했습니다. 매칭이 완료되었습니다.' : '거절했습니다.', 'ok');
    window.dispatchEvent(new Event('yc:noti-changed'));
    return true;
  } catch(e){
    toast(e.message, 'err');
    window.dispatchEvent(new Event('yc:noti-changed'));
    return false;
  }
}

function showNotiPopup(item){
  const label = { request:'용차 의뢰', accepted:'매칭 완료', rejected:'의뢰 결과' }[item.type] || '알림';
  let actions = '<button class="btn btn-ghost" data-act="close">닫기</button>';
  if(item.type === 'request' && item.reqStatus === '대기'){
    actions = '<button class="btn btn-danger" data-act="reject">거절하기</button><button class="btn btn-ok" data-act="accept">수락하기</button>';
  } else if(item.type === 'accepted'){
    actions = '<button class="btn btn-ghost" data-act="close">닫기</button><button class="btn btn-primary" data-act="view">매칭 정보 보기</button>';
  }
  const m = openModal('<span class="tag ' + esc(item.type) + '">' + esc(label) + '</span><h3 style="margin-top:10px;font-size:16px;line-height:1.5">' +
    esc(item.msg) + '</h3><div class="m-actions">' + actions + '</div>', true);
  api('markRead', { nids: [item.nid] }).catch(function(){});
  m.addEventListener('click', async function(e){
    const b = e.target.closest('[data-act]'); if(!b) return;
    const act = b.dataset.act;
    if(act === 'close'){ closeModal(); }
    else if(act === 'view'){ showMatchScreen(item.rid); }
    else if(act === 'accept'){ b.disabled = true; closeModal(); if(await respondTo(item.rid, true)) showMatchScreen(item.rid); }
    else if(act === 'reject'){ b.disabled = true; closeModal(); await respondTo(item.rid, false); }
  });
}

async function showMatchScreen(rid){
  try {
    const r = await api('request', { rid: rid });
    const q = r.request, j = r.job, c = r.counterpart;
    const done = q.status === '수락';
    const hero = done
      ? '<div class="match-hero"><div class="ok-ico">' + ICON.check + '</div><h3>매칭이 완료되었습니다</h3><div class="muted small">' + esc(kdate(j.date)) + ' ' + esc(j.shift || '주간') + ' 용차 (PDD 기준)</div></div>'
      : '<div class="match-hero pending"><div class="ok-ico">' + ICON.bell + '</div><h3>의뢰 정보</h3><div class="muted small">상태: ' + esc(q.status) + '</div></div>';
    const who = q.role === 'owner' ? '용차 기사' : '용차 요청자';
    const contact = done
      ? '<div class="jc-row"><b>이름</b><span>' + esc(c.name || '-') + '</span></div>' +
        '<div class="jc-row"><b>연락처</b><span>' + telLink(c.phone) + '</span></div>' +
        '<div class="jc-row"><b>퀵플렉스</b><span>' + esc(c.qfId || '-') + '</span></div>'
      : '<div class="jc-row"><b>연락처</b><span class="muted">수락 후 공개됩니다</span></div>';
    openModal(hero +
      '<div class="card detail-rows" style="margin:0 0 4px">' +
      '<div class="jc-row"><b>' + who + '</b><span><strong>@' + esc(c.id) + '</strong></span></div>' + contact +
      '</div><div class="card detail-rows" style="margin:10px 0 0">' +
      '<div class="jc-row"><b>날짜</b><span>' + esc(kdate(j.date)) + ' <span class="muted small">PDD 기준</span></span></div>' +
      '<div class="jc-row"><b>근무</b><span>' + shiftTag(j.shift) + '</span></div>' +
      '<div class="jc-row"><b>캠프</b><span>' + esc(j.camp) + '</span></div>' +
      '<div class="jc-row"><b>라우트</b><span>' + esc(j.route) + '</span></div>' +
      '<div class="jc-row"><b>단가</b><span><strong>' + won(j.price) + '</strong>' + (j.jibun ? ' (지번 포함)' : '') + '</span></div>' +
      '<div class="jc-row"><b>주차자리</b><span>' + esc(j.parking || '-') + '</span></div>' +
      '<div class="jc-row"><b>배송팁</b><span>' + esc(j.tip || '-') + '</span></div>' +
      '<div class="jc-row"><b>특이사항</b><span>' + esc(j.note || '-') + '</span></div></div>' +
      '<div class="m-actions">' + (done ? '<a class="btn btn-ghost" href="schedule.html">스케줄 보기</a>' : '') + '<button class="btn btn-primary" onclick="closeModal()">확인</button></div>');
  } catch(e){
    toast(e.message, 'err');
  }
}

/* ---------- 달력 컴포넌트 ----------
 * opts.mode  'multi'  : 여러 날짜 선택 (opts.min 이전은 비활성)
 *            'pick'   : opts.dates({'yyyy-MM-dd':{cls}}) 에 있는 날짜만 클릭 가능
 */
function Calendar(el, opts){
  opts = opts || {};
  const today = todayStr();
  const base = opts.start ? parseYmd(opts.start) : new Date();
  let y = base.getFullYear(), m = base.getMonth();
  const selected = new Set(opts.selected || []);
  let dates = opts.dates || null;

  function render(){
    const startDow = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    let h = '<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1" aria-label="이전 달">‹</button>' +
            '<div class="cal-title">' + y + '년 ' + (m+1) + '월</div>' +
            '<button type="button" class="cal-nav" data-nav="1" aria-label="다음 달">›</button></div><div class="cal-grid">';
    DOW.forEach(function(d, i){ h += '<div class="cal-dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '">' + d + '</div>'; });
    for(let i = 0; i < startDow; i++) h += '<div></div>';
    for(let d = 1; d <= days; d++){
      const ds = y + '-' + pad(m+1) + '-' + pad(d);
      let cls = 'cal-day', dis = false;
      if(dates){
        const info = dates[ds];
        if(!info) dis = true; else cls += ' ' + (info.cls || 'open');
      } else if(opts.min && ds < opts.min){ dis = true; }
      if(selected.has(ds)) cls += ' selected';
      if(ds === today) cls += ' today';
      if(dis) cls += ' disabled';
      h += '<button type="button" class="' + cls + '" data-date="' + ds + '"' + (dis ? ' disabled' : '') + '>' + d + '</button>';
    }
    el.innerHTML = h + '</div>';
  }

  el.addEventListener('click', function(e){
    const nav = e.target.closest('[data-nav]');
    if(nav){
      m += Number(nav.dataset.nav);
      if(m < 0){ m = 11; y--; } if(m > 11){ m = 0; y++; }
      render(); return;
    }
    const b = e.target.closest('.cal-day');
    if(!b || b.disabled) return;
    const ds = b.dataset.date;
    if(opts.mode === 'multi'){
      if(selected.has(ds)) selected.delete(ds); else selected.add(ds);
      render();
      if(opts.onChange) opts.onChange(Array.from(selected).sort());
    } else {
      selected.clear(); selected.add(ds); render();
      if(opts.onPick) opts.onPick(ds, dates ? dates[ds] : null);
    }
  });

  render();
  return {
    getSelected: function(){ return Array.from(selected).sort(); },
    setDates: function(d){ dates = d; render(); },
    select: function(ds){ selected.clear(); if(ds) selected.add(ds); render(); },
    clear: function(){ selected.clear(); render(); if(opts.onChange) opts.onChange([]); }
  };
}
