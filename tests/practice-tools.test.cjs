// Run: NODE_PATH=$CODEX_PRIMARY_RUNTIME_NODE_MODULES node tests/practice-tools.test.cjs
const {createCanvas}=require('@napi-rs/canvas');
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const callbacks={},elements={},storage=new Map(),spoken=[];
class Element{
 constructor(id){this.id=id;this.textContent='';this.value='';this.checked=false;this.style={};this.events={};this.classList={add(){},remove(){}};}
 addEventListener(type,fn){this.events[type]=fn;}
 replaceChildren(){} add(){} append(){}
 set innerHTML(v){} get innerHTML(){return '';}
}
const element=id=>elements[id]||(elements[id]=new Element(id));
function canvas(){const c=createCanvas(320,320);const ctx=c.getContext('2d'),fillText=ctx.fillText.bind(ctx);ctx.fillText=(text,x,y)=>fillText('A',x,y);c.events={};c.addEventListener=(t,f)=>c.events[t]=f;c.setPointerCapture=()=>{};c.hasPointerCapture=()=>false;c.getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});return c;}
elements.writebox=canvas();elements.traceGuide=canvas();element('ko').textContent='안녕.';element('traceLevel').value='easy';
const bubbles=[new Element(),new Element()];
let available=[{name:'SunHi',lang:'ko-KR',voiceURI:'female1'},{name:'JiMin',lang:'ko-KR',voiceURI:'female2'}];
const synth={getVoices:()=>available,cancel(){},speak:u=>spoken.push(u),addEventListener(){}};
const document={getElementById:element,querySelector:()=>new Element(),querySelectorAll:()=>bubbles,createElement:t=>t==='canvas'?canvas():new Element(),addEventListener:(t,f)=>(callbacks[t]??=[]).push(f),fonts:{ready:Promise.resolve()}};
const sandbox={document,window:{speechSynthesis:synth},speechSynthesis:synth,SpeechSynthesisUtterance:function(text){this.text=text;},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Option:function(t,v){this.text=t;this.value=v;},navigator:{},location:{href:'https://example.com/korean-learning-app/'},URL,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('practice-tools.js','utf8'),sandbox);callbacks.DOMContentLoaded.forEach(f=>f());
const speech=sandbox.window.KorSpeech;speech.speak('A',0);speech.speak('B',1);assert.notEqual(spoken[0].voice.voiceURI,spoken[1].voice.voiceURI);assert.notEqual(spoken[0].pitch,spoken[1].pitch);
available=[available[0]];speech.speak('A',0);speech.speak('B',1);assert.equal(spoken[2].voice.voiceURI,spoken[3].voice.voiceURI);assert.notEqual(spoken[2].rate,spoken[3].rate);
let continued=false;speech.speak('old',0,()=>continued=true);const old=spoken.at(-1);speech.cancel();old.onend();assert.equal(continued,false);
const trace=sandbox.window.KorTrace;trace.reset();assert.match(element('traceProgress').textContent,/1 \/ 2/);
element('check').onclick();assert.match(element('writeanswer').textContent,/まず/);
const c=elements.writebox;c.events.pointerdown({isPrimary:true,pointerId:1,clientX:40,clientY:40,preventDefault(){}});c.events.pointermove({pointerId:1,clientX:60,clientY:50,preventDefault(){}});c.events.pointerup({pointerId:1,type:'pointerup'});
assert(c.getContext('2d').getImageData(0,0,320,320).data.some(v=>v));element('clear').onclick();assert(!c.getContext('2d').getImageData(0,0,320,320).data.some(v=>v));
// Arbitrary filled pad must fail (not award automatic full credit).
c.getContext('2d').fillRect(0,0,320,320);element('check').onclick();assert.match(element('writeanswer').textContent,/残っている部分/);
element('clear').onclick();const ctx=c.getContext('2d');ctx.font='230px "Noto Sans KR", "Malgun Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('안',160,176);element('check').onclick();assert.equal(element('writeanswer').textContent,'なぞれました！');
element('traceNext').onclick();assert.match(element('traceProgress').textContent,/2 \/ 2/);element('ko').textContent='감사합니다.';trace.reset();assert.match(element('traceProgress').textContent,/1 \/ 5/);
console.log('PASS: two voices, single voice contrast, cancellation, pointer drawing, clear, blank/scribble rejection, trace match, character navigation and reset');
