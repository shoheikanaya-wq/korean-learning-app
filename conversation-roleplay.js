/* conversation-roleplay.js : 会話れんしゅう(韓国語アプリ)
 *  相手が韓国語で話しかけ → あなたが答える → 答えの見本を聞く、の練習です。
 *  教材(window.LESSONS)の「会話A・会話B」をそのまま使います。教材は変更しません。
 *  ・声の聞き取りが使える端末では、答えがお手本に近いかを判定します(使えない端末では、自分で確かめます)
 *  ・「ヒント」でカタカナと日本語を見られます
 *  外したいときは、readable-kana.js の「会話れんしゅう」の4行を消すだけ。
 */
(function () {
  'use strict';
  var synth = window.speechSynthesis;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var LABEL = { beginner: '初級', intermediate: '中級', daily: '日常', travel: '旅行', business: '仕事', advanced: '上級', super: '超級' };
  var STAT = 'korRoleStats';
  var el = {}, st = { rows: [], i: 0, token: 0, rec: null, voice: null, cat: '' };

  function $(id) { return document.getElementById(id); }
  function mk(tag, css, txt) { var n = document.createElement(tag); if (css) n.style.cssText = css; if (txt != null) n.textContent = txt; return n; }
  function btn(txt, css, fn) { var b = mk('button', 'min-height:54px;font-size:20px;font-weight:900;border-radius:14px;' + css, txt); b.type = 'button'; b.onclick = fn; return b; }

  function lessons() { return window.LESSONS || {}; }
  function pool(cat) { return (lessons()[cat] || []).filter(function (r) { return r && r[5] && r[6]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function voice() {
    if (st.voice) return st.voice;
    var vs = (synth && synth.getVoices && synth.getVoices()) || [];
    st.voice = vs.filter(function (v) { return /^ko/i.test(v.lang); })[0] || null;
    return st.voice;
  }
  function say(text, rate) {
    return new Promise(function (resolve) {
      if (!synth || !voice()) return resolve(false);
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.voice = voice(); u.rate = rate || 0.85;
      var done = false; function fin() { if (!done) { done = true; resolve(true); } }
      u.onend = fin; u.onerror = fin; setTimeout(fin, 12000);
      synth.cancel(); synth.speak(u);
    });
  }

  function norm(s) { return String(s || '').replace(/[\s.,!?。、？！~〜]/g, ''); }
  function sim(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return 0;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
  }

  function saveStat(ok, cat) {
    try {
      var s = JSON.parse(localStorage.getItem(STAT) || '{}');
      s.total = (s.total || 0) + 1; s.ok = (s.ok || 0) + (ok ? 1 : 0);
      s.cat = s.cat || {}; s.cat[cat] = s.cat[cat] || { t: 0, ok: 0 };
      s.cat[cat].t++; if (ok) s.cat[cat].ok++;
      localStorage.setItem(STAT, JSON.stringify(s));
    } catch (e) {}
  }

  function show(parts) { el.body.innerHTML = ''; parts.forEach(function (p) { el.body.appendChild(p); }); }
  function bubble(who, ko, extra) {
    var b = mk('div', 'background:' + (who === 'A' ? '#eef4ff' : '#eaf6ee') + ';border-radius:16px;padding:12px 14px;margin:8px 0');
    b.appendChild(mk('div', 'font-size:14px;font-weight:800;color:#5a6b7d', who === 'A' ? '相手' : 'あなたの答え(お手本)'));
    b.appendChild(mk('div', 'font-size:clamp(26px,7vw,34px);font-weight:900;color:#211d19;line-height:1.3', ko));
    if (extra) b.appendChild(mk('div', 'font-size:17px;font-weight:700;color:#444;margin-top:4px', extra));
    return b;
  }

  /* ---- 画面 ---- */
  function menu() {
    st.token++; if (synth) try { synth.cancel(); } catch (e) {}
    var items = [mk('div', 'font-size:20px;font-weight:900;margin:6px 0 10px', 'どの場面で練習しますか?')];
    var any = false;
    Object.keys(LABEL).forEach(function (k) {
      var n = pool(k).length; if (!n) return; any = true;
      items.push(btn(LABEL[k] + '(' + n + ')', 'width:100%;margin:6px 0;border:3px solid #2f6f4f;background:#fff;color:#2f6f4f', function () { start(k); }));
    });
    if (!any) items.push(mk('div', 'font-size:18px;color:#a33;font-weight:800', '練習できる会話が見つかりません'));
    show(items);
  }

  function start(cat) {
    st.cat = cat; st.rows = shuffle(pool(cat)).slice(0, 5); st.i = 0; ask();
  }

  function ask() {
    var my = ++st.token;
    if (st.i >= st.rows.length) return finish();
    var r = st.rows[st.i];
    var status = mk('div', 'font-size:19px;font-weight:900;text-align:center;margin:6px 0;color:#2f6f4f', '👂 相手の話を聞きます');
    var hint = mk('div', 'display:none;font-size:18px;font-weight:700;background:#fff7dd;border-radius:12px;padding:10px;margin:6px 0;line-height:1.5');
    hint.textContent = 'ヒント:' + (r[2] ? r[2] + '(' + (r[4] || '') + ')' : (r[4] || ''));
    var result = mk('div', 'font-size:20px;font-weight:900;text-align:center;min-height:30px;margin:6px 0');
    var row = mk('div', 'display:flex;gap:8px;margin-top:6px');
    var speak = btn(SR ? '🎤 話す' : '🎤 言ってみる', 'flex:1;border:0;background:#2f6f4f;color:#fff', function () { answer(r, status, result, my); });
    var again = btn('🔁 もう一度聞く', 'flex:1;border:2px solid #bbb;background:#fff;color:#444;font-size:17px', function () { say(r[5], 0.8); });
    row.appendChild(speak); row.appendChild(again);
    var h = btn('💡 ヒント', 'width:100%;margin-top:6px;border:2px solid #d6a92e;background:#fff0bd;color:#4a3a10;min-height:46px;font-size:18px', function () { hint.style.display = 'block'; });
    var ans = btn('答えを聞く', 'width:100%;margin-top:6px;border:2px solid #2f6f4f;background:#fff;color:#2f6f4f;min-height:46px;font-size:18px', function () { reveal(r, my); });
    show([mk('div', 'font-size:15px;font-weight:800;color:#777', (st.i + 1) + ' / ' + st.rows.length + '　' + (r[0] || '')), bubble('A', r[5]), status, row, hint, h, result, ans]);
    say(r[5], 0.8).then(function (ok) {
      if (my !== st.token) return;
      status.textContent = ok ? '🎤 あなたの番です。答えてみましょう' : '🎤 あなたの番です(この端末では声が出ません。文を見て答えてください)';
    });
  }

  function answer(r, status, result, my) {
    if (!SR) { status.textContent = '🎤 声に出して答えたら「答えを聞く」を押してください'; return; }
    try { if (synth) synth.cancel(); } catch (e) {}
    var rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = false; rec.maxAlternatives = 3;
    status.textContent = '🎤 聞いています…';
    var got = false;
    rec.onresult = function (e) {
      got = true;
      var best = 0, said = '';
      for (var k = 0; k < e.results[0].length; k++) {
        var t = e.results[0][k].transcript, s = sim(t, r[6]);
        if (s >= best) { best = s; said = t; }
      }
      var ok = best >= 0.7;
      saveStat(ok, st.cat);
      result.style.color = ok ? '#2f6f4f' : '#b5481f';
      result.textContent = (ok ? '🎉 いいですね!' : '👀 もう少し') + '(聞こえた言葉:' + said + ')';
      status.textContent = ok ? '' : '「答えを聞く」でお手本を確かめましょう';
      if (ok) setTimeout(function () { reveal(r, my); }, 700);
    };
    rec.onerror = function () { status.textContent = '聞き取れませんでした。もう一度「話す」を押してください'; };
    rec.onend = function () { if (!got && status.textContent === '🎤 聞いています…') status.textContent = '聞き取れませんでした。もう一度「話す」を押してください'; };
    try { rec.start(); } catch (e) {}
  }

  function reveal(r, my) {
    if (my !== st.token) return;
    var nx = btn(st.i + 1 >= st.rows.length ? '終わる' : '次へ ▶', 'width:100%;margin-top:10px;border:0;background:#2f6f4f;color:#fff', function () { st.i++; ask(); });
    var rp = btn('🔊 お手本をもう一度', 'width:100%;margin-top:6px;border:2px solid #2f6f4f;background:#fff;color:#2f6f4f;min-height:46px;font-size:18px', function () { say(r[6], 0.7); });
    show([mk('div', 'font-size:15px;font-weight:800;color:#777', (st.i + 1) + ' / ' + st.rows.length + '　' + (r[0] || '')), bubble('A', r[5]), bubble('B', r[6], (r[2] && r[6] === r[1] ? r[2] + '　' : '') + (r[4] && r[6] === r[1] ? r[4] : '')), rp, nx]);
    say(r[6], 0.7);
  }

  function finish() {
    var s = {}; try { s = JSON.parse(localStorage.getItem(STAT) || '{}'); } catch (e) {}
    show([mk('div', 'font-size:46px;text-align:center', '🎉'), mk('div', 'font-size:24px;font-weight:900;text-align:center', 'おつかれさまでした'),
      mk('div', 'font-size:17px;text-align:center;color:#555;margin:6px 0', s.total ? ('これまでの声での判定:' + s.ok + ' / ' + s.total + ' 回 よくできました') : ''),
      btn('もう一度(別の会話)', 'width:100%;margin-top:10px;border:0;background:#2f6f4f;color:#fff', function () { start(st.cat); }),
      btn('場面を選びなおす', 'width:100%;margin-top:6px;border:2px solid #bbb;background:#fff;color:#444;font-size:18px', menu)]);
  }

  function build() {
    var ov = mk('div', 'position:fixed;inset:0;z-index:99991;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center');
    var box = mk('div', 'background:#fff;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:14px 16px 20px;max-height:94vh;overflow:auto');
    var head = mk('div', 'display:flex;justify-content:space-between;align-items:center');
    head.appendChild(mk('div', 'font-size:20px;font-weight:900;color:#2f6f4f', '💬 会話れんしゅう'));
    var close = btn('閉じる', 'min-height:42px;font-size:16px;padding:0 14px;border:2px solid #bbb;background:#fff;color:#444', function () { st.token++; try { synth && synth.cancel(); } catch (e) {} ov.style.display = 'none'; });
    head.appendChild(close);
    el.body = mk('div', '');
    box.appendChild(head); box.appendChild(el.body); ov.appendChild(box); document.body.appendChild(ov);

    var open = mk('button', 'display:block;margin:8px auto;min-height:52px;padding:0 22px;font-size:20px;font-weight:900;border:3px solid #2f6f4f;border-radius:14px;background:#fff;color:#2f6f4f', '💬 会話れんしゅう');
    open.type = 'button'; open.id = 'roleOpenBtn';
    open.onclick = function () { ov.style.display = 'flex'; menu(); };
    var anchor = $('gapOpenBtn') || $('kanaDetail') || document.querySelector('.jaBlock');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(open, anchor.nextSibling);
    else { open.style.cssText += ';position:fixed;right:10px;bottom:130px;z-index:9990'; document.body.appendChild(open); }
  }

  function init() { setTimeout(function () { try { build(); } catch (e) {} }, 600); }
  window.KOR_ROLE_TEST = { sim: sim };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
