(() => {
  const $=id=>document.getElementById(id);
  let pending=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const installed=()=>{ $('status').textContent='アプリとして起動しています。下の「韓国語の練習を開く」から始められます。';$('install').hidden=true; };
  if(standalone())installed();
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e;$('status').textContent='準備ができました。「このスマホにインストール」を押してください。';});
  window.addEventListener('appinstalled',()=>{pending=null;$('status').textContent='インストールが受け付けられました。ホーム画面の「韓国語」アイコンから開いてください。';$('install').hidden=true;});
  $('install').onclick=async()=>{
    if(standalone()){installed();return;}
    if(!pending){$('status').textContent='このブラウザからインストール画面を開けませんでした。下の手順でブラウザのメニューから追加してください。';$('steps').scrollIntoView({behavior:'smooth',block:'center'});return;}
    const prompt=pending;pending=null;
    try{await prompt.prompt();const choice=await prompt.userChoice;$('status').textContent=choice.outcome==='accepted'?'追加処理中です。ホーム画面の「韓国語」アイコンを確認してください。':'追加をキャンセルしました。必要になったらブラウザのメニューから追加できます。';}
    catch{$('status').textContent='下の手順でブラウザのメニューから追加してください。';}
  };
  const url=new URL('./install.html',location.href).href;
  $('appLink').href=url;$('appLink').textContent=url;
  async function copy(){try{await navigator.clipboard.writeText(url);$('shareStatus').textContent='リンクをコピーしました。相手へのメッセージに貼り付けてください。';}catch{$('shareStatus').textContent='下のリンクを長押ししてコピーしてください。';}}
  $('copyLink').onclick=copy;
  $('shareLink').onclick=async()=>{if(!navigator.share){await copy();return;}try{await navigator.share({title:'韓国語アプリ',url});}catch(e){if(e.name!=='AbortError')await copy();}};
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=3401',{updateViaCache:'none'}).catch(()=>{$('status').textContent='アプリの準備に失敗しました。通信を確認してページを開き直してください。';});
})();
