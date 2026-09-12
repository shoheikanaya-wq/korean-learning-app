/* Shared speech profiles and local-only handwriting. No recording is uploaded. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  let token = 0;
  const koreanVoices = () => {
    const all = window.speechSynthesis?.getVoices() || [];
    return [...new Map(all.filter(v => /^ko(?:[-_]|$)/i.test(v.lang)).map(v => [v.voiceURI, v])).values()];
  };
  const preferred = list => [...list].sort((a,b) => Number(/SunHi|JiMin|YuJin|SeoHyeon|SoonBok|Heami|female|여성/i.test(b.name)) - Number(/SunHi|JiMin|YuJin|SeoHyeon|SoonBok|Heami|female|여성/i.test(a.name)));
  function profile(role) {
    const list = preferred(koreanVoices());
    const chosen = list.find(v => v.voiceURI === read('korVoice'+role));
    const voice = chosen || list[role] || list[0];
    // Keep pitch close to natural voice ranges. Large pitch shifts can produce wavering/robotic playback on Android TTS.
    return role ? {voice, pitch:1.08, rate:.90} : {voice, pitch:.98, rate:.86};
  }
  function cancel() {
    token++;
    window.speechSynthesis?.cancel();
    document.querySelectorAll('.bubble').forEach(e => e.classList.remove('speaking'));
  }
  function speak(text, role=0, after) {
    const feedback = $('convFeedback');
    if (!window.speechSynthesis) {
      if (feedback) { feedback.textContent='このブラウザでは音声再生に対応していません。Chromeで開いてください。'; feedback.style.display='block'; }
      return;
    }
    const run=token, p=profile(role), u=new SpeechSynthesisUtterance(text || '');
    u.lang='ko-KR'; u.pitch=p.pitch; u.rate=p.rate; u.volume=1;
    if(p.voice)u.voice=p.voice;
    const bubble=document.querySelectorAll('.bubble')[role];
    u.onstart=()=>{if(run===token)bubble?.classList.add('speaking');};
    u.onend=()=>{
      bubble?.classList.remove('speaking');
      // Give Android TTS a short release gap before switching speakers. This avoids clipped/wavering starts.
      if(run===token && after)setTimeout(()=>{if(run===token)after();},220);
    };
    u.onerror=()=>{bubble?.classList.remove('speaking');if(run===token && feedback){feedback.textContent='音声を再生できませんでした。通信と端末の韓国語音声を確認して、もう一度お試しください。';feedback.style.display='block';}};
    window.speechSynthesis.speak(u);
  }
  window.KorSpeech={speak,cancel};
  document.addEventListener('DOMContentLoaded',()=>{
    const mini=document.querySelector('.mini');
    const details=document.createElement('details');details.className='voice-settings';
    details.innerHTML='<summary>A・Bの声を選ぶ・試す</summary><p class="voice-note">Aは落ち着いた声、Bは明るい声。声質を極端に加工せず、自然に聞こえる設定です。</p><label>Aの音声<select id="voiceA"></select></label><label>Bの音声<select id="voiceB"></select></label><div class="voice-tests"><button id="testA">Aを試聴</button><button id="testB">Bを試聴</button></div><p id="voiceStatus" class="voice-note" role="status"></p>';
    mini?.append(details);
    function refresh(){
      const list=preferred(koreanVoices());
      ['voiceA','voiceB'].forEach((id,role)=>{
        const select=$(id);select.replaceChildren(new Option(role?'自動：明るい声':'自動：落ち着いた声',''));
        list.forEach(v=>select.add(new Option(v.name,v.voiceURI)));
        select.value=list.some(v=>v.voiceURI===read('korVoice'+role))?read('korVoice'+role):'';
        select.onchange=()=>{save('korVoice'+role,select.value);status();};
      });status();
    }
    function status(){
      const list=koreanVoices(), a=profile(0).voice,b=profile(1).voice;
      $('voiceStatus').textContent=!list.length?'韓国語音声を取得できていません。端末の標準音声を使います。':a?.voiceURI===b?.voiceURI?'同じ音声エンジンを使っています。揺れを防ぐため加工差を小さくしています。':'AとBに別の韓国語音声を設定しています。';
    }
    refresh();window.speechSynthesis?.addEventListener('voiceschanged',refresh);
    ['testA','testB'].forEach((id,role)=>$(id).onclick=()=>{cancel();setTimeout(()=>speak('안녕하세요. 만나서 반가워요.',role),80);});
    document.addEventListener('click',e=>{if(e.target.closest('#homeBtn,#prev,#next,#topPrev,#topNext,#listen,#slow,[data-start],[data-c]'))cancel();},true);
    $('scene')?.addEventListener('change',cancel);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    const share=$('shareApp');if(share)share.onclick=async()=>{
      const url=new URL('./install.html',location.href).href;
      try{if(navigator.share)await navigator.share({title:'韓国語 実践トレーニング',url});else{location.href='./install.html#share';}}catch(e){if(e.name!=='AbortError')$('shareStatus').textContent='インストール案内ページのリンクをコピーして渡してください。';}
    };
  });

  document.addEventListener('DOMContentLoaded',()=>{
    const canvas=$('writebox'), guide=$('traceGuide');if(!canvas||!guide)return;
    const ctx=canvas.getContext('2d'),g=guide.getContext('2d');
    const mask=document.createElement('canvas');mask.width=mask.height=320;const m=mask.getContext('2d',{willReadFrequently:true});
    let letters=[], pos=0, strokes=[], active=null, timer, scores=[], hidden=false, completed=false;
    function currentText(){return $('ko').textContent.normalize('NFC');}
    function paint(){
      ctx.clearRect(0,0,320,320);ctx.strokeStyle='#304e72';ctx.fillStyle='#304e72';ctx.lineWidth=13;ctx.lineCap='round';ctx.lineJoin='round';
      for(const points of strokes){if(!points.length)continue;ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.stroke();ctx.beginPath();ctx.arc(...points[0],6.5,0,Math.PI*2);ctx.fill();}
    }
    function drawGuide(){
      g.clearRect(0,0,320,320);g.strokeStyle='#e2dbd1';g.setLineDash([5,6]);g.beginPath();g.moveTo(160,0);g.lineTo(160,320);g.moveTo(0,160);g.lineTo(320,160);g.stroke();g.setLineDash([]);
      m.clearRect(0,0,320,320);m.font='230px "Noto Sans KR", "Malgun Gothic", sans-serif';m.textAlign='center';m.textBaseline='middle';m.fillStyle='#000';m.fillText(letters[pos]||'',160,176);
      if(!hidden){g.save();g.globalAlpha=.19;g.drawImage(mask,0,0);g.restore();}
      $('traceProgress').textContent=letters.length?`${pos+1} / ${letters.length}文字${hidden?'':'　「'+letters[pos]+'」をなぞる'}`:'この文にはなぞる韓国語文字がありません。';
      $('tracePrev').disabled=pos===0;$('traceNext').disabled=pos>=letters.length-1;
    }
    function clear(){clearTimeout(timer);strokes=[];active=null;completed=false;paint();$('writeanswer').classList.remove('show');}
    function reset(){letters=Array.from(currentText()).filter(x=>/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(x));pos=0;scores=[];hidden=false;$('hide').textContent='見ないで挑戦';clear();drawGuide();}
    function metrics(){
      const target=m.getImageData(0,0,320,320).data, ink=ctx.getImageData(0,0,320,320).data;
      let total=0,covered=0,written=0,near=0;
      const tolerance=$('traceLevel').value==='easy'?12:7;
      for(let y=0;y<320;y+=2)for(let x=0;x<320;x+=2){const k=(y*320+x)*4+3;
        if(target[k]>60){total++;if(ink[k]>40)covered++;}
        if(ink[k]>40){written++;let hit=false;for(let dy=-tolerance;dy<=tolerance&&!hit;dy+=3)for(let dx=-tolerance;dx<=tolerance;dx+=3){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<320&&yy>=0&&yy<320&&target[(yy*320+xx)*4+3]>60){hit=true;break;}}if(hit)near++;}
      }
      const coverage=total?covered/total:0,precision=written?near/written:0;
      return {score:Math.round(100*coverage*precision),pass:coverage>=($('traceLevel').value==='easy'?.67:.8)&&precision>=.8,written};
    }
    function show(text){$('writeanswer').textContent=text;$('writeanswer').classList.add('show');}
    function check(auto=false){
      if(active||completed)return;
      const result=metrics();if(!result.written){if(!auto)show('まず薄い文字を指でなぞってみましょう。');return;}
      if(result.pass){scores[pos]=result.score;show('なぞれました！');if(auto){if(pos<letters.length-1){pos++;clear();drawGuide();}else finish();}}
      else if(!auto)show(`なぞりの目安 ${result.score}%：薄い文字の残っている部分をなぞってみましょう。文字認識や書き順の採点ではありません。`);
    }
    function finish(){completed=true;const n=scores.filter(Number.isFinite).length;const mean=n?Math.round(scores.filter(Number.isFinite).reduce((a,b)=>a+b,0)/n):0;show(`全文字の練習が終わりました。答え：${currentText()}　なぞれた文字 ${n}/${letters.length}、なぞりの平均 ${mean}%。文字認識・書き順の採点ではありません。`);}
    function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(319,(e.clientX-r.left)*320/r.width)),Math.max(0,Math.min(319,(e.clientY-r.top)*320/r.height))];}
    canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||!letters.length)return;e.preventDefault();clearTimeout(timer);completed=false;active=e.pointerId;canvas.setPointerCapture(active);strokes.push([point(e)]);paint();});
    canvas.addEventListener('pointermove',e=>{if(active!==e.pointerId)return;e.preventDefault();strokes[strokes.length-1].push(point(e));paint();});
    const end=e=>{if(active!==e.pointerId)return;active=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(e.type==='pointerup'&&$('traceAuto').checked)timer=setTimeout(()=>check(true),1100);};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    $('clear').onclick=clear;$('check').onclick=()=>{check(false);if(pos===letters.length-1&&scores[pos]!=null)finish();};
    $('tracePrev').onclick=()=>{if(pos>0){pos--;clear();drawGuide();}};
    $('traceNext').onclick=()=>{if(pos<letters.length-1){pos++;clear();drawGuide();}};
    $('hide').onclick=()=>{hidden=!hidden;$('hide').textContent=hidden?'見ながら練習':'見ないで挑戦';drawGuide();};
    $('traceAuto').onchange=()=>clearTimeout(timer);
    window.KorTrace={reset};reset();document.fonts?.ready.then(()=>drawGuide());
  });
})();