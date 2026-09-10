/* Read-only device checks; results stay on this device unless the user copies them. */
(() => {
  const $=id=>document.getElementById(id);
  const report=new Map();let running=false,offered=false;
  const put=(key,ok,detail)=>{report.set(key,{ok,detail});render();};
  function render(){
    const list=$('installChecks');list.replaceChildren();
    for(const [key,{ok,detail}] of report){const row=document.createElement('li');row.textContent=`${ok===true?'✓':ok===false?'×':'…'} ${key}：${detail}`;list.append(row);}
  }
  const bounded=async(promise)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('8秒以内に応答がありません')),8000);})]);}finally{clearTimeout(timer);}};
  async function get(url){const response=await bounded(fetch(url,{cache:'no-store'}));if(!response.ok)throw new Error('HTTP '+response.status);return response;}
  async function run(){
    if(running)return;running=true;$('runChecks').disabled=true;
    try{
      put('確認版',true,'3.5');
      const ua=navigator.userAgent,chrome=ua.match(/(?:Chrome|CriOS)\/([\d.]+)/),android=ua.match(/Android ([\d.]+)/);
      put('ブラウザ',null,`${chrome?'Chrome '+chrome[1]:'Chrome以外／判定不可'}${android?'・Android '+android[1]:''}${/; wv\)/.test(ua)?'・アプリ内表示':''}`);
      put('安全な接続',window.isSecureContext,window.isSecureContext?'HTTPSで接続':'HTTPS接続を確認してください');
      put('起動状態',null,matchMedia('(display-mode: standalone)').matches||navigator.standalone===true?'アプリ表示':'ブラウザ表示（この案内ページの現在の状態）');
      const manifestURL=new URL(document.querySelector('link[rel="manifest"]').href);
      try{
        const response=await get(manifestURL),m=await response.json();
        const start=new URL(m.start_url,manifestURL),scope=new URL(m.scope||'.',manifestURL);
        const valid=Boolean(m.name||m.short_name)&&['standalone','fullscreen','minimal-ui'].includes(m.display)&&start.origin===location.origin&&start.href.startsWith(scope.href)&&location.href.startsWith(scope.href)&&m.prefer_related_applications!==true;
        put('アプリ設定',valid,valid?'名前・起動先・表示範囲を確認':'名前・起動先・表示範囲に不整合');
        await Promise.all([192,512].map(async size=>{
          const icon=(m.icons||[]).find(i=>String(i.sizes).split(/\s+/).includes(size+'x'+size)&&(!i.purpose||i.purpose.split(/\s+/).includes('any')));
          if(!icon){put('アイコン '+size,false,'設定にありません');return;}
          try{
            const blob=await (await get(new URL(icon.src,manifestURL))).blob();
            const img=new Image(),url=URL.createObjectURL(blob);
            try{await bounded(new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('画像を読み取れません'));img.src=url;}));put('アイコン '+size,img.naturalWidth===size&&img.naturalHeight===size,`${img.naturalWidth}×${img.naturalHeight} 読み取り済み`);}finally{URL.revokeObjectURL(url);}
          }catch(e){put('アイコン '+size,false,e.message);}
        }));
      }catch(e){put('アプリ設定',false,e.message);}
      try{
        if(!('serviceWorker'in navigator))throw new Error('このブラウザでは利用できません');
        const reg=await bounded(navigator.serviceWorker.ready);
        put('アプリ用処理',Boolean(reg.active),reg.active?'起動済み':'起動待ち');
        put('この画面への適用',Boolean(navigator.serviceWorker.controller),navigator.serviceWorker.controller?'適用済み':'初回準備中。ページを一度開き直して確認');
      }catch(e){put('アプリ用処理',false,e.message);}
      put('Chromeのインストール許可',offered?true:null,offered?'受信済み。上のインストールボタンを押せます':'まだ未受信。上の項目が✓でも、インストール可能とは断定できません');
    }finally{running=false;$('runChecks').disabled=false;}
  }
  window.addEventListener('beforeinstallprompt',()=>{offered=true;put('Chromeのインストール許可',true,'受信済み。上のインストールボタンを押せます');});
  window.addEventListener('appinstalled',()=>put('インストール受付',true,'受付済み。ホームのアイコンから起動を確認してください'));
  $('runChecks').onclick=run;
  $('copyChecks').onclick=async()=>{
    const text='韓国語 インストール確認\n'+[...report].map(([k,v])=>`${k}: ${v.detail}`).join('\n');
    try{await navigator.clipboard.writeText(text);$('checkCopyStatus').textContent='コピーしました。この会話へ貼り付けてください。';}
    catch{$('checkCopyStatus').textContent='コピーできない場合は、この確認結果の画面を撮って送ってください。';}
  };
  run();
})();
