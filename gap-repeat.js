/* gap-repeat.js : 間つきくり返し練習(韓国語アプリ)
 *  お手本を聞く → 間(自分で言う番) → またお手本、をくり返す練習です。
 *  ・「うしろから区切る」: 文の終わりから少しずつ長くして言う(長い文でも言いやすくなる練習法)
 *  ・「録音して聞き比べ」: 最後に、自分の声をお手本のあとに流す(許可したときだけ)
 *  外したいときは、readable-kana.js の「くり返し練習」の4行を消すだけ。学習データは変更しません。
 */
(function () {
  'use strict';
  var synth = window.speechSynthesis;
  var token = 0, running = false, voice = null;
  var rec = { stream: null };
  var el = {};

  function $(id) { return document.getElementById(id); }
  function koText() { var k = $('ko'); return k ? (k.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  function pickVoice() {
    if (!synth) return null;
    var vs = synth.getVoices() || [];
    var ko = vs.filter(function (v) { return /^ko/i.test(v.lang); });
    return ko[0] || null;
  }

  function say(text, rate) {
    return new Promise(function (resolve) {
      var t0 = Date.now(), u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; if (voice) u.voice = voice; u.rate = rate;
      var done = false;
      function fin() { if (done) return; done = true; resolve(Date.now() - t0); }
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 15000);
      synth.cancel(); synth.speak(u);
    });
  }
  function wait(ms, my, label) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function tick() {
        if (my !== token) return resolve();
        var p = Math.min(1, (Date.now() - t0) / ms);
        el.bar.style.width = (100 * (1 - p)) + '%';
        if (p >= 1) return resolve();
        setTimeout(tick, 60);
      })();
    });
  }
  function status(icon, msg, sub) {
    el.icon.textContent = icon; el.msg.textContent = msg; el.sub.textContent = sub || '';
  }

  function chunks(text, back) {
    var words = text.replace(/[.?!。？！,]/g, '').split(' ').filter(Boolean);
    var list = [];
    if (back && words.length >= 3) {
      for (var i = words.length - 1; i >= 0; i--) list.push(words.slice(i).join(' '));
      list.pop(); // 最後は全文(下で別に扱う)
    }
    return { parts: list, full: text };
  }

  function startRec() {
    if (!el.recChk.checked || !navigator.mediaDevices || !window.MediaRecorder) return Promise.resolve(null);
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mr = new MediaRecorder(stream), parts = [];
      mr.ondataavailable = function (e) { if (e.data && e.data.size) parts.push(e.data); };
      var done = new Promise(function (res) { mr.onstop = function () { stream.getTracks().forEach(function (t) { t.stop(); }); res(new Blob(parts, { type: mr.mimeType || 'audio/webm' })); }; });
      mr.start();
      return { stop: function () { try { mr.stop(); } catch (e) {} return done; } };
    }).catch(function () { el.recChk.checked = false; return null; });
  }
  function playBlob(blob, my) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(blob), a = new Audio(url);
      a.onended = a.onerror = function () { URL.revokeObjectURL(url); resolve(); };
      if (my !== token) return resolve();
      a.play().catch(resolve);
    });
  }

  function run() {
    var text = koText();
    if (!text) { status('⚠', '先にフレーズを開いてください', ''); return; }
    if (!synth || !(voice = pickVoice())) {
      status('⚠', 'この端末では韓国語の声が使えません', '端末の設定で韓国語の音声を入れると使えます');
      return;
    }
    var my = ++token; running = true; el.go.textContent = '■ 止める'; el.phrase.textContent = text;
    var rate = el.slow.checked ? 0.6 : 0.85;
    var plan = chunks(text, el.back.checked);
    var seq = plan.parts.slice(); seq.push(plan.full, plan.full, plan.full);
    var i = 0, blobP = null;

    (function step() {
      if (my !== token) return;
      if (i >= seq.length) { status('🎉', 'おつかれさまでした', 'もう一度やるときは「はじめる」'); finish(); return; }
      var part = seq[i], last = i === seq.length - 1;
      el.phrase.textContent = part;
      el.count.textContent = (i + 1) + ' / ' + seq.length;
      status('👂', 'お手本を聞きます', 'よく聞いてください');
      say(part, rate).then(function (dur) {
        if (my !== token) return;
        status('🎤', 'あなたの番です', '聞いたとおりに言ってみましょう');
        var gap = Math.max(2500, dur * 1.6 + 1200);
        var rp = last ? startRec() : Promise.resolve(null);
        return rp.then(function (r) {
          return wait(gap, my).then(function () { return r ? r.stop() : null; });
        });
      }).then(function (blob) {
        if (my !== token) return;
        if (blob) {
          status('🔊', 'お手本 → あなたの声', '聞き比べてみましょう');
          el.phrase.textContent = part;
          return say(part, 0.85).then(function () { return playBlob(blob, my); });
        }
      }).then(function () { if (my === token) { i++; setTimeout(step, 300); } });
    })();
  }
  function finish() { running = false; el.go.textContent = '▶ はじめる'; el.bar.style.width = '0%'; }
  function stop() { token++; try { synth && synth.cancel(); } catch (e) {} finish(); }

  function mk(tag, css, txt) { var n = document.createElement(tag); if (css) n.style.cssText = css; if (txt) n.textContent = txt; return n; }
  function chk(label, on) {
    var l = mk('label', 'display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800;min-height:44px;color:#211d19');
    var c = document.createElement('input'); c.type = 'checkbox'; c.checked = on; c.style.cssText = 'width:26px;height:26px';
    l.appendChild(c); l.appendChild(document.createTextNode(label)); l.input = c; return l;
  }

  function build() {
    var ov = mk('div', 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center');
    var box = mk('div', 'background:#fff;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:14px 16px 20px;max-height:92vh;overflow:auto');
    var head = mk('div', 'display:flex;justify-content:space-between;align-items:center');
    head.appendChild(mk('div', 'font-size:20px;font-weight:900;color:#2f6f4f', '🔁 くり返し練習'));
    el.count = mk('div', 'font-size:16px;font-weight:800;color:#777');
    head.appendChild(el.count);
    el.phrase = mk('div', 'font-size:clamp(30px,8vw,42px);font-weight:900;text-align:center;margin:14px 0 6px;line-height:1.3;color:#211d19');
    el.icon = mk('div', 'font-size:44px;text-align:center'); el.msg = mk('div', 'font-size:24px;font-weight:900;text-align:center;color:#211d19');
    el.sub = mk('div', 'font-size:18px;text-align:center;color:#555;margin-bottom:8px;min-height:24px');
    var barBox = mk('div', 'height:14px;background:#e6e1d8;border-radius:8px;overflow:hidden;margin:6px 0 12px');
    el.bar = mk('div', 'height:100%;width:0;background:#e0a31f'); barBox.appendChild(el.bar);
    var o1 = chk('ゆっくり再生', true), o2 = chk('うしろから区切って言う', true), o3 = chk('最後に録音して聞き比べ', false);
    el.slow = o1.input; el.back = o2.input; el.recChk = o3.input;
    el.go = mk('button', 'width:100%;min-height:58px;margin-top:8px;font-size:22px;font-weight:900;border:0;border-radius:14px;background:#2f6f4f;color:#fff', '▶ はじめる');
    el.go.type = 'button'; el.go.onclick = function () { running ? stop() : run(); };
    var close = mk('button', 'width:100%;min-height:50px;margin-top:8px;font-size:19px;font-weight:800;border:2px solid #bbb;border-radius:14px;background:#fff;color:#444', '閉じる');
    close.type = 'button'; close.onclick = function () { stop(); ov.style.display = 'none'; };
    [head, el.phrase, el.icon, el.msg, el.sub, barBox, o1, o2, o3, el.go, close].forEach(function (n) { box.appendChild(n); });
    ov.appendChild(box); document.body.appendChild(ov); el.ov = ov;

    var open = mk('button', 'display:block;margin:8px auto;min-height:52px;padding:0 22px;font-size:20px;font-weight:900;border:3px solid #2f6f4f;border-radius:14px;background:#fff;color:#2f6f4f', '🔁 くり返し練習');
    open.type = 'button'; open.id = 'gapOpenBtn';
    open.onclick = function () {
      var t = koText(); el.phrase.textContent = t; el.count.textContent = '';
      status('🔁', '「はじめる」を押してください', 'お手本 → あなたの番、をくり返します');
      ov.style.display = 'flex';
    };
    var anchor = document.getElementById('kanaDetail') || document.querySelector('.jaBlock');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(open, anchor.nextSibling);
    else { open.style.cssText += ';position:fixed;right:10px;bottom:70px;z-index:9990'; document.body.appendChild(open); }
  }

  function init() { try { build(); } catch (e) {} if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', function () {}); }
  window.KOR_GAP_TEST = { chunks: chunks };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
