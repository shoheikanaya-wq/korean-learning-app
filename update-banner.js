/* update-banner.js : 「新しい版があります。更新しますか?」の表示(韓国語アプリ)
 *  ・アプリを開いたとき / 画面に戻ったときに、サーバー上の教材やプログラムが変わっていないか確かめる
 *  ・変わっていたら、画面の下に「更新する」ボタンを出す。押すと最新の画面に読み込み直す
 *  ・学習の記録(端末内の保存データ)は消えない
 *  外したいときは、readable-kana.js の「更新のお知らせ」の4行を消すだけ。
 */
(function () {
  'use strict';
  var APP_VERSION = '4.1.0';   // 画面に出る版番号。更新のたびに、ここだけ書き換える
  var KEY = 'korAppSig';
  var bar = null;

  function sigOf(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      return url + '|' + (r.headers.get('etag') || '') + '|' + (r.headers.get('last-modified') || '') + '|' + (r.headers.get('content-length') || '');
    }).catch(function () { return url + '|?'; });
  }

  function files() {
    var list = ['./index.html'];
    var tags = document.querySelectorAll('script[src]');
    for (var i = 0; i < tags.length; i++) {
      var s = tags[i].getAttribute('src') || '';
      if (/^https?:|^\/\//.test(s)) continue;
      list.push(s.split('?')[0]);
    }
    return list;
  }

  function currentSig() {
    return Promise.all(files().map(sigOf)).then(function (a) {
      var t = a.join('\n'), h = 0;
      for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
      return String(h) + ':' + a.length;
    });
  }

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function showVersion() {
    var label = 'Ver.' + APP_VERSION;
    function sync() {
      var els = document.querySelectorAll('body *'), i, t;
      for (i = 0; i < els.length; i++) {
        if (els[i].children.length === 0) {
          t = (els[i].textContent || '').trim();
          if (/^Ver\.?\s*\d/.test(t) && els[i].id !== 'korVerFallback') { els[i].textContent = label; return true; }
        }
      }
      return false;
    }
    var n = 0, timer = setInterval(function () {
      n++;
      if (sync() || n > 10) {
        clearInterval(timer);
        if (n > 10) {
          var v = document.createElement('div');
          v.id = 'korVerFallback';
          v.textContent = label;
          v.style.cssText = 'position:fixed;right:6px;bottom:2px;z-index:9000;font-size:12px;color:#8a837a;pointer-events:none';
          document.body.appendChild(v);
        }
      }
    }, 300);
  }

  function newVersion() {
    return fetch('./update-banner.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/APP_VERSION\s*=\s*'([^']+)'/);
      return m ? m[1] : '';
    }).catch(function () { return ''; });
  }

  function show(newSig, ver) {
    if (bar) return;
    bar = document.createElement('div');
    bar.setAttribute('role', 'alert');
    bar.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#fff;border:3px solid #2f6f4f;border-radius:14px;' +
      'box-shadow:0 4px 18px rgba(0,0,0,.3);padding:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;font-family:inherit';
    var msg = document.createElement('div');
    msg.textContent = '新しい版' + (ver && ver !== APP_VERSION ? '(Ver ' + ver + ')' : '') + 'があります。更新しますか?';
    msg.style.cssText = 'font-size:20px;font-weight:900;color:#211d19;flex:1 1 100%;text-align:center';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = '更新する';
    ok.style.cssText = 'min-height:52px;padding:0 28px;font-size:20px;font-weight:900;border:0;border-radius:12px;background:#2f6f4f;color:#fff';
    var later = document.createElement('button');
    later.type = 'button';
    later.textContent = 'あとで';
    later.style.cssText = 'min-height:52px;padding:0 22px;font-size:18px;font-weight:800;border:2px solid #bbb;border-radius:12px;background:#fff;color:#444';
    ok.onclick = function () {
      ok.textContent = '更新中...';
      set(newSig);
      var done = function () { location.reload(); };
      if (window.caches && caches.keys) {
        caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); }).then(done, done);
      } else done();
    };
    later.onclick = function () { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; };
    bar.appendChild(msg); bar.appendChild(ok); bar.appendChild(later);
    document.body.appendChild(bar);
  }

  var busy = false;
  function check() {
    if (busy || bar) return;
    busy = true;
    currentSig().then(function (sig) {
      busy = false;
      var old = get();
      if (!old) { set(sig); return; }   // 初回は記録だけ
      if (old !== sig) newVersion().then(function (v) { show(sig, v); });
    }, function () { busy = false; });
  }

  function start() {
    showVersion();
    check();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
