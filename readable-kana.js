/* readable-kana.js : 韓国語アプリ 読みやすい表記への変更(学習データは変更しません)
 *  1. 発音記号の行を、通常は表示しない
 *  2. カタカナ読みを、大きさ・色が1種類の表示にそろえる(矢印は表示しない)
 *  3. 質問の文(最後が「?」)だけ、「最後を上げて言います」を添える
 *  4. 発音記号と抑揚の記号は、「くわしく見る」の中にしまう
 *
 *  元に戻したいときは、index.html に足した1行を消すだけです。
 */
(function () {
  'use strict';

  /* ===== 見た目の設定 ===== */
  var css = [
    // 1. 発音記号の行を隠す
    'body #phonetic.phonetic{display:none!important}',

    // 2. カタカナ:大きさ・色・位置をそろえ、矢印を隠す
    'body #pron{gap:0!important;row-gap:4px!important;min-height:0!important;padding:6px 2px 4px!important;align-items:baseline!important}',
    'body #pron .mora,body #pron .mora.level-high,body #pron .mora.level-low,body #pron .mora.level-mid,' +
      'body #pron .mora.up,body #pron .mora.down,body #pron .mora.rise,body #pron .mora.fall,body #pron .mora.flat{' +
      'font-size:clamp(30px,8.6vw,44px)!important;font-weight:900!important;line-height:1.25!important;' +
      'min-height:0!important;transform:none!important;color:#211d19!important;opacity:1!important;letter-spacing:0!important}',
    'body.largeText #pron .mora,body.largeText #pron .mora.level-high,body.largeText #pron .mora.level-low,body.largeText #pron .mora.level-mid,' +
      'body.largeText #pron .mora.up,body.largeText #pron .mora.down,body.largeText #pron .mora.rise,body.largeText #pron .mora.fall,body.largeText #pron .mora.flat{' +
      'font-size:clamp(34px,9.8vw,52px)!important}',
    'body #pron .mora small{display:none!important}',
    'body #pron .space{width:.7em!important}',

    // 3. 質問の文の一言
    '#qTag{display:none;margin:2px auto 8px;padding:6px 14px;border:2px solid #d6a92e;border-radius:12px;' +
      'background:#fff0bd;color:#4a3a10;font-size:20px;font-weight:900;text-align:center;width:fit-content;max-width:100%}',
    'body.largeText #qTag{font-size:24px}',

    // 4. くわしく見る
    '#kanaDetail{margin:6px 0 10px;border:2px solid #d8d1c7;border-radius:12px;background:#fff;padding:2px 10px}',
    '#kanaDetail summary{cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:850;color:#514a43}',
    '#kanaDetail .kanaDetailBody{white-space:pre-line;padding:4px 2px 10px;font-size:18px;font-weight:700;line-height:1.6;color:#3a342e}',
    'body.largeText #kanaDetail summary{font-size:20px}',
    'body.largeText #kanaDetail .kanaDetailBody{font-size:21px}'
  ].join('\n');

  var st = document.createElement('style');
  st.id = 'readableKanaStyle';
  st.textContent = css;
  document.head.appendChild(st);

  /* ===== 追加する部品 ===== */
  var tag = null;
  var detail = null;
  var detailBody = null;
  var lastText = '';

  function build() {
    var pron = document.getElementById('pron');
    var jaBlock = document.querySelector('.jaBlock');
    if (!pron || !jaBlock || !pron.parentNode) return false;

    tag = document.createElement('div');
    tag.id = 'qTag';
    tag.textContent = '↗ 最後を上げて言います';
    pron.parentNode.insertBefore(tag, pron.nextSibling);

    detail = document.createElement('details');
    detail.id = 'kanaDetail';
    var sum = document.createElement('summary');
    sum.textContent = 'くわしく見る(発音記号)';
    detailBody = document.createElement('div');
    detailBody.className = 'kanaDetailBody';
    detail.appendChild(sum);
    detail.appendChild(detailBody);
    jaBlock.parentNode.insertBefore(detail, jaBlock.nextSibling);
    return true;
  }

  function update() {
    var ko = document.getElementById('ko');
    var pron = document.getElementById('pron');
    if (!ko || !pron || !tag || !detail) return;

    var text = (ko.textContent || '').trim();

    // 質問の文だけ、一言を出す
    tag.style.display = /[?？]\s*$/.test(text) ? 'block' : 'none';

    // 発音記号と抑揚の記号は、「くわしく見る」へ
    var ph = ((document.getElementById('phonetic') || {}).textContent || '').trim();
    var label = pron.getAttribute('aria-label') || '';
    var m = label.match(/抑揚\s*(.*?)。/);
    var tones = m ? m[1].trim() : '';
    var lines = [];
    if (ph) lines.push('発音記号:' + ph);
    if (tones) lines.push('抑揚の目安:' + tones);
    detailBody.textContent = lines.join('\n');
    detail.style.display = lines.length ? '' : 'none';

    // 新しいフレーズに変わったら、閉じた状態に戻す
    if (text !== lastText) {
      detail.open = false;
      lastText = text;
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(function () {
      scheduled = false;
      try { update(); } catch (e) { /* 表示の補助なので、失敗しても学習は止めない */ }
    });
  }

  function init() {
    if (!build()) return;
    var ko = document.getElementById('ko');
    var pron = document.getElementById('pron');
    var obs = new MutationObserver(schedule);
    obs.observe(ko, { childList: true, characterData: true, subtree: true });
    obs.observe(pron, { childList: true, attributes: true, attributeFilter: ['aria-label'] });
    var ph = document.getElementById('phonetic');
    if (ph) obs.observe(ph, { childList: true, characterData: true, subtree: true });
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
