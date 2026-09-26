(() => {
  const $=id=>document.getElementById(id);
  let pending=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const installed=()=>{ $('status').textContent='アプリとして起動しています。下の「韓国語の練習を開く」から始められます。';$('install').hidden=true; };
  if(standalone())installed();
  window.addEventListener('beforeinstallprompt',e=>{pending=e;$('status').textContent='Chromeがアプリとして認識しました。自動のインストール案内が出た場合は、そのまま「インストール」を選んでください。出ない場合は上のボタンを押してください。';});
  window.addEventListener('appinstalled',()=>{pending=null;$('status').textContent='インストールが受け付けられました。ホーム画面の「韓国語」アイコンから開いてください。';$('install').hidden=true;});
  $('install').onclick=async()=>{
    if(standalone()){installed();return;}
    if(!pending){$('status').textContent='PWAアプリのインストール準備を確認しています。Chromeでこのページを開いたまま数秒待ち、もう一度このボタンを押してください。「ショートカットを作成」だけの場合は選ばず、下の確認を開いてください。';$('steps').open=true;$('steps').scrollIntoView({behavior:'smooth',block:'start'});return;}
    const prompt=pending;pending=null;
    try{await prompt.prompt();const choice=await prompt.userChoice;$('status').textContent=choice.outcome==='accepted'?'追加処理中です。ホーム画面の「韓国語」アイコンを確認してください。':'追加をキャンセルしました。必要になったらブラウザのメニューから追加できます。';}
    catch{$('status').textContent='下の手順でブラウザのメニューから追加してください。';}
  };
  const INSTALL_PATH='/korean-learning-app/install.html';
  const url=new URL(INSTALL_PATH,location.origin).href;
  $('appLink').href=url;$('appLink').textContent=url;
  async function copy(){try{await navigator.clipboard.writeText(url);$('shareStatus').textContent='リンクをコピーしました。相手へのメッセージに貼り付けてください。';}catch{$('shareStatus').textContent='下のリンクを長押ししてコピーしてください。';}}
  $('copyLink').onclick=copy;
  $('shareLink').onclick=async()=>{if(!navigator.share){await copy();return;}try{await navigator.share({title:'韓国語アプリ',url});}catch(e){if(e.name!=='AbortError')await copy();}};
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=313120',{updateViaCache:'none'}).catch(()=>{$('status').textContent='アプリの準備に失敗しました。通信を確認してページを開き直してください。';});
})();
