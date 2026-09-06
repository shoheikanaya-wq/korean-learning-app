(function(){
  const X=window.LESSONS||(window.LESSONS={daily:[],travel:[],business:[]});
  X.daily=X.daily||[];X.travel=X.travel||[];X.business=X.business||[];

  X.travel.push(
    ['空港・搭乗口','탑승구가 어디예요?','タプスングガ オディエヨ','→ → ↗','搭乗口はどこですか？','탑승구가 어디예요?','저쪽 끝에 있어요.'],
    ['空港・搭乗時間','몇 시에 탑승해요?','ミョッ シエ タプスンヘヨ','→ → ↗','何時に搭乗しますか？','몇 시에 탑승해요?','오후 세 시부터 탑승해요.'],
    ['空港・遅延','비행기가 지연됐어요?','ピヘンギガ チヨンドェッソヨ','→ → ↗','飛行機は遅れていますか？','비행기가 지연됐어요?','네, 삼십 분 지연됐어요.'],
    ['ホテル・荷物預け','짐을 맡길 수 있어요?','チムル マッキル ス イッソヨ','→ → ↗','荷物を預けられますか？','짐을 맡길 수 있어요?','네, 보관해 드릴게요.'],
    ['ホテル・部屋変更','방을 바꿀 수 있을까요?','パンウル パックル ス イッスルカヨ','→ → ↗','部屋を替えられますか？','방을 바꿀 수 있을까요?','확인해 볼게요.'],
    ['ホテル・エアコン','에어컨이 안 돼요.','エオコニ アン ドェヨ','→ ↘','エアコンが動きません。','에어컨이 안 돼요.','직원이 확인하러 갈게요.'],
    ['ホテル・騒音','옆방이 너무 시끄러워요.','ヨッパンイ ノム シックロウォヨ','→ → ↘','隣の部屋がうるさいです。','옆방이 너무 시끄러워요.','죄송합니다. 확인하겠습니다.'],
    ['地下鉄・最終電車','막차가 몇 시예요?','マクチャガ ミョッ シエヨ','→ ↗','終電は何時ですか？','막차가 몇 시예요?','열두 시쯤이에요.'],
    ['地下鉄・出口','몇 번 출구로 나가요?','ミョッ ポン チュルグロ ナガヨ','→ → ↗','何番出口から出ますか？','몇 번 출구로 나가요?','오 번 출구로 나가세요.'],
    ['バス・交通カード','교통카드로 탈 수 있어요?','キョトンカドゥロ タル ス イッソヨ','→ → ↗','交通カードで乗れますか？','교통카드로 탈 수 있어요?','네, 찍고 타세요.'],
    ['タクシー・急ぎ','조금 빨리 가 주세요.','チョグム パルリ カ ジュセヨ','→ → ↘','少し急いでください。','조금 빨리 가 주세요.','네, 알겠습니다.'],
    ['道案内・徒歩','걸어서 얼마나 걸려요?','コロソ オルマナ コルリョヨ','→ → ↗','歩いてどれくらいかかりますか？','걸어서 얼마나 걸려요?','십 분 정도 걸려요.'],
    ['道案内・近い','여기에서 가까워요?','ヨギエソ カッカウォヨ','→ ↗','ここから近いですか？','여기에서 가까워요?','네, 바로 근처예요.'],
    ['飲食店・席','창가 자리 있어요?','チャンガ チャリ イッソヨ','→ ↗','窓側の席はありますか？','창가 자리 있어요?','네, 이쪽에 있어요.'],
    ['飲食店・辛さ確認','이거 많이 매워요?','イゴ マニ メウォヨ','→ ↗','これはかなり辛いですか？','이거 많이 매워요?','조금 매워요.'],
    ['飲食店・アレルギー','땅콩이 들어가요?','タンコンイ トゥロガヨ','→ ↗','ピーナッツは入っていますか？','땅콩이 들어가요?','아니요, 안 들어가요.'],
    ['飲食店・持ち帰り','포장해 주세요.','ポジャンヘ ジュセヨ','→ ↘','持ち帰りにしてください。','포장해 주세요.','네, 포장해 드릴게요.'],
    ['買い物・免税','면세 돼요?','ミョンセ ドェヨ','→ ↗','免税できますか？','면세 돼요?','네, 여권 보여 주세요.'],
    ['買い物・色違い','다른 색도 있어요?','タルン セクト イッソヨ','→ ↗','別の色もありますか？','다른 색도 있어요?','네, 검은색도 있어요.'],
    ['観光・写真依頼','사진 좀 찍어 주세요.','サジン チョム チゴ ジュセヨ','→ → ↘','写真を撮ってください。','사진 좀 찍어 주세요.','네, 찍어 드릴게요.'],
    ['観光・営業時間','몇 시까지 해요?','ミョッ シッカジ ヘヨ','→ ↗','何時までやっていますか？','몇 시까지 해요?','오후 여섯 시까지예요.'],
    ['観光・休館日','오늘 쉬는 날이에요?','オヌル シヌン ナリエヨ','→ ↗','今日は休みですか？','오늘 쉬는 날이에요?','아니요, 오늘 열어요.'],
    ['病院・体調不良','몸이 안 좋아요.','モミ アン チョアヨ','→ ↘','具合が悪いです。','몸이 안 좋아요.','어디가 아프세요?'],
    ['病院・薬局','약국이 어디예요?','ヤックギ オディエヨ','→ ↗','薬局はどこですか？','약국이 어디예요?','건너편에 있어요.'],
    ['緊急・警察','경찰을 불러 주세요.','キョンチャルル プルロ ジュセヨ','→ ↘','警察を呼んでください。','경찰을 불러 주세요.','네, 바로 연락할게요.']
  );

  X.business.push(
    ['仕事・初対面','처음 뵙겠습니다.','チョウム プェプケッスムニダ','→ ↘','はじめまして。','처음 뵙겠습니다.','저도 반갑습니다.'],
    ['仕事・名乗る','저는 다나카라고 합니다.','チョヌン タナカラゴ ハムニダ','→ → ↘','田中と申します。','저는 다나카라고 합니다.','만나서 반갑습니다.'],
    ['仕事・名刺','명함 드리겠습니다.','ミョンハム トゥリゲッスムニダ','→ ↘','名刺をお渡しします。','명함 드리겠습니다.','감사합니다.'],
    ['仕事・担当者','담당자가 누구예요?','タムダンジャガ ヌグエヨ','→ ↗','担当者は誰ですか？','담당자가 누구예요?','김 대리입니다.'],
    ['仕事・確認','확인해 보겠습니다.','ファギネ ポゲッスムニダ','→ ↘','確認してみます。','확인해 보겠습니다.','네, 부탁드립니다.'],
    ['仕事・少し待つ','잠시만 기다려 주세요.','チャムシマン キダリョ ジュセヨ','→ → ↘','少々お待ちください。','잠시만 기다려 주세요.','네, 알겠습니다.'],
    ['仕事・資料','자료를 보내 주세요.','チャリョルル ポネ ジュセヨ','→ ↘','資料を送ってください。','자료를 보내 주세요.','네, 메일로 보내겠습니다.'],
    ['仕事・メール','메일 확인 부탁드립니다.','メイル ファギン プタクトゥリムニダ','→ ↘','メールの確認をお願いします。','메일 확인 부탁드립니다.','네, 확인하겠습니다.'],
    ['仕事・会議開始','회의를 시작하겠습니다.','フェイルル シジャカゲッスムニダ','→ ↘','会議を始めます。','회의를 시작하겠습니다.','네, 시작하시죠.'],
    ['仕事・意見','제 생각은 조금 다릅니다.','チェ センガグン チョグム タルムニダ','→ → ↘','私の考えは少し違います。','제 생각은 조금 다릅니다.','어떤 점이 다른가요?'],
    ['仕事・賛成','저도 동의합니다.','チョド トンイハムニダ','→ ↘','私も賛成です。','저도 동의합니다.','좋습니다.'],
    ['仕事・再説明','다시 설명해 주시겠어요?','タシ ソルミョンヘ ジュシゲッソヨ','→ → ↗','もう一度説明していただけますか？','다시 설명해 주시겠어요?','네, 다시 설명드리겠습니다.'],
    ['仕事・納期','납기는 언제예요?','ナプキヌン オンジェエヨ','→ ↗','納期はいつですか？','납기는 언제예요?','다음 주 금요일입니다.'],
    ['仕事・変更','일정이 변경됐어요.','イルチョンイ ピョンギョンドェッソヨ','→ ↘','予定が変更になりました。','일정이 변경됐어요.','새 일정을 알려 주세요.'],
    ['仕事・遅延','작업이 조금 늦어지고 있어요.','チャゴビ チョグム ヌジョジゴ イッソヨ','→ → ↘','作業が少し遅れています。','작업이 조금 늦어지고 있어요.','완료 예정은 언제예요?'],
    ['工場・設備異常','설비에 이상이 있어요.','ソルビエ イサンイ イッソヨ','→ ↘','設備に異常があります。','설비에 이상이 있어요.','어떤 이상인가요?'],
    ['工場・停止','기계를 멈춰 주세요.','キゲルル モムチョ ジュセヨ','→ ↘','機械を止めてください。','기계를 멈춰 주세요.','네, 정지하겠습니다.'],
    ['工場・点検','점검이 필요합니다.','チョムゴミ ピリョハムニダ','→ ↘','点検が必要です。','점검이 필요합니다.','언제 점검할까요?'],
    ['工場・油漏れ','기름이 새고 있어요.','キルミ セゴ イッソヨ','→ ↘','油が漏れています。','기름이 새고 있어요.','어디에서 새고 있나요?'],
    ['工場・水漏れ','물이 새고 있어요.','ムリ セゴ イッソヨ','→ ↘','水が漏れています。','물이 새고 있어요.','밸브를 확인해 주세요.'],
    ['工場・異音','이상한 소리가 나요.','イサンハン ソリガ ナヨ','→ ↘','異音がします。','이상한 소리가 나요.','어디에서 들리나요?'],
    ['工場・温度','온도가 너무 높아요.','オンドガ ノム ノパヨ','→ ↘','温度が高すぎます。','온도가 너무 높아요.','냉각 상태를 확인하세요.'],
    ['工場・圧力','압력이 낮아요.','アムリョギ ナジャヨ','→ ↘','圧力が低いです。','압력이 낮아요.','배관을 확인해 주세요.'],
    ['工場・安全確認','안전 확인부터 합시다.','アンジョン ファギンブト ハプシダ','→ ↘','まず安全確認をしましょう。','안전 확인부터 합시다.','네, 확인하겠습니다.'],
    ['工場・復旧','정상적으로 복구됐어요.','チョンサンジョグロ ポックドェッソヨ','→ ↘','正常に復旧しました。','정상적으로 복구됐어요.','수고하셨습니다.']
  );

  document.addEventListener('DOMContentLoaded',()=>{
    const q=id=>document.getElementById(id);
    const version=document.querySelector('.version');
    if(version)version.textContent='Ver.2.2';

    const retry=q('retry');
    if(retry)retry.remove();
    const actions=document.querySelector('.actions');
    if(actions){actions.style.gridTemplateColumns='1fr';}
    const speak=q('speak');
    if(speak){speak.style.minHeight='66px';speak.style.fontSize='19px';}

    const mini=document.querySelector('.mini');
    const convBtn=q('conv');
    if(!mini||!convBtn)return;

    const control=document.createElement('div');
    control.style.cssText='margin:10px 0;display:grid;gap:8px';
    const label=document.createElement('div');
    label.textContent='会話で自分が話す役を選ぶ';
    label.style.cssText='font-weight:900;font-size:16px';
    const select=document.createElement('select');
    select.id='convMode';
    select.style.cssText='width:100%;min-height:58px;padding:8px;font-size:17px';
    [
      ['app','👩‍💬 AもBもアプリが話す'],
      ['userA','🎤 私がAを話す'],
      ['userB','🎤 私がBを話す']
    ].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;select.appendChild(o)});
    const note=document.createElement('div');
    note.style.cssText='font-size:14px;font-weight:700;color:#555;line-height:1.45';
    const feedback=document.createElement('div');
    feedback.id='convFeedback';
    feedback.style.cssText='display:none;padding:11px;border-radius:12px;background:#f3f3f3;font-size:16px;font-weight:750;line-height:1.5';
    control.append(label,select,note,feedback);
    convBtn.before(control);

    function currentLesson(){
      const cat=document.querySelector('.tabs .on')?.dataset.c || 'daily';
      const idx=Number(q('scene')?.value||0);
      return (window.LESSONS?.[cat]||[])[idx];
    }
    function setFeedback(text){feedback.textContent=text;feedback.style.display='block';}
    function appSay(text,voiceIndex=0,onend){
      if(!('speechSynthesis' in window)){if(onend)onend();return;}
      const u=new SpeechSynthesisUtterance(text||'');
      u.lang='ko-KR';u.rate=.84;
      const vs=speechSynthesis.getVoices().filter(v=>/^ko/i.test(v.lang));
      if(vs.length)u.voice=vs[voiceIndex%vs.length];
      u.onend=()=>{if(onend)onend()};
      speechSynthesis.speak(u);
    }
    function score(a,b){
      const norm=s=>String(s||'').replace(/[\s.?!？！。、]/g,'');
      a=norm(a);b=norm(b);if(!a||!b)return 0;
      const m=Array.from({length:b.length+1},(_,r)=>[r]);
      for(let j=0;j<=a.length;j++)m[0][j]=j;
      for(let r=1;r<=b.length;r++)for(let j=1;j<=a.length;j++)m[r][j]=b[r-1]===a[j-1]?m[r-1][j-1]:1+Math.min(m[r-1][j-1],m[r][j-1],m[r-1][j]);
      return Math.max(0,Math.round((1-m[b.length][a.length]/Math.max(a.length,b.length))*100));
    }
    function listenUser(target,role,after){
      const R=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!R){setFeedback('この端末では音声認識が使えません。AもBもアプリが話すモードは利用できます。');return;}
      const r=new R();r.lang='ko-KR';r.interimResults=false;r.maxAlternatives=1;
      setFeedback(role+'を話してください…');
      r.onresult=e=>{
        const heard=e.results[0][0].transcript;
        const sc=score(heard,target);
        const msg=sc>=90?'かなり近いです。':sc>=75?'よく伝わる発音です。':sc>=55?'もう少しゆっくり区切ってみましょう。':'お手本を聞いてから、短く区切ってもう一度試してみましょう。';
        setFeedback(role+'：一致度 '+sc+'%　聞き取り「'+heard+'」　'+msg);
        if(after)setTimeout(after,500);
      };
      r.onerror=()=>setFeedback('聞き取れませんでした。もう一度「会話を始める」を押してください。');
      r.start();
    }
    function updateMode(){
      const m=select.value;
      if(m==='app'){note.textContent='聞き取り練習：AとBの両方をアプリが読みます。';convBtn.textContent='▶ A・Bの会話を聞く';}
      if(m==='userA'){note.textContent='あなたがAを話すと、アプリがBで返答します。';convBtn.textContent='🎤 私がAを話して会話';}
      if(m==='userB'){note.textContent='アプリがAを話したあと、あなたがBで返答します。';convBtn.textContent='🎤 私がBを話して会話';}
      feedback.style.display='none';
      localStorage.setItem('korConvMode',m);
    }
    select.value=localStorage.getItem('korConvMode')||'app';
    select.onchange=updateMode;
    updateMode();

    convBtn.onclick=()=>{
      const x=currentLesson();if(!x)return;
      if('speechSynthesis' in window)speechSynthesis.cancel();
      const m=select.value;
      feedback.style.display='none';
      if(m==='app'){
        appSay(x[5],0,()=>appSay(x[6],1));
      }else if(m==='userA'){
        listenUser(x[5],'A',()=>appSay(x[6],1));
      }else{
        setFeedback('まずAを聞いてください。続いてBを話します。');
        appSay(x[5],0,()=>setTimeout(()=>listenUser(x[6],'B'),350));
      }
    };
  });
})();
