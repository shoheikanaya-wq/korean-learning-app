/* lessons-weekly.js : 週3回の自動追加で増える教材(追記専用)
 *
 * 形式: [場面, 韓国語, カタカナ, 抑揚(空でよい), 日本語, 会話A, 会話B]
 *   例: ['値段を聞く','이거 얼마예요?','イゴ オルマエヨ','','これはいくらですか？','이거 얼마예요?','만 원이에요.']
 *
 * 決まり:
 *  - 既存の教材ファイル(lessons.js など)は変更せず、新しい教材はこのファイルにだけ足す
 *  - 追加は、下の印の間に「add('カテゴリ名', [ ... ]);」の形で行う
 *  - カテゴリ名: beginner / intermediate / daily / travel / business / advanced / super
 *  - 元に戻すときは、足した add(...) の部分を消すだけでよい
 */
(function () {
  'use strict';

  var X = window.LESSONS || (window.LESSONS = {});

  function add(cat, rows) {
    X[cat] = X[cat] || [];
    rows.forEach(function (r) {
      X[cat].push(r);
    });
  }

  // ▼▼ 自動追加は、この印の下に追記されます ▼▼

  // ▲▲ 自動追加は、この印の上に追記されます ▲▲

  // add が使われていなくても、エラーにならないようにしておく
  void add;
})();
