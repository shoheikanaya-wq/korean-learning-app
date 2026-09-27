import express from 'express';
import {Firestore} from '@google-cloud/firestore';

const app=express();
app.use(express.json({limit:'32kb'}));

const PORT=process.env.PORT||8080;
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'https://shoheikanaya-wq.github.io';
const ADMIN_TOKEN=process.env.KOR_ADMIN_TOKEN||'';
const firestore=process.env.KOR_ENABLE_STORAGE==='1'?new Firestore():null;
const collection=firestore?.collection('kor_progress');
const feedbackCollection=firestore?.collection('kor_feedback');

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin',ALLOWED_ORIGIN);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');
  if(req.method==='OPTIONS')return res.sendStatus(204);
  next();
});

app.get('/health',(_req,res)=>res.json({ok:true,service:'kor-progress-api'}));

function cleanProgress(body){
  if(!body||body.schema!==1||typeof body.device!=='string'||body.device.length>100)return null;
  const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
  const progress={};
  for(const k of ['daily','travel','business']){
    const x=body.progress?.[k]||{};
    progress[k]={done:n(x.done),total:n(x.total)};
  }
  return {
    schema:1,
    device:body.device,
    firstOpened:n(body.firstOpened),
    opened:n(body.opened),
    launches:n(body.launches),
    studied:n(body.studied),
    lastStudy:n(body.lastStudy),
    progress
  };
}

function cleanFeedback(body){
  if(!body||typeof body.device!=='string'||body.device.length>100)return null;
  const type=String(body.type||'other').slice(0,40);
  const text=String(body.text||'').trim().slice(0,500);
  if(!text)return null;
  return {schema:1,device:body.device,type,text,createdAt:Date.now(),status:'open'};
}

app.post('/v1/feedback',async(req,res)=>{
  const payload=cleanFeedback(req.body);
  if(!payload)return res.status(400).json({ok:false,error:'invalid_payload'});
  if(!feedbackCollection)return res.status(202).json({ok:true,persisted:false});
  try{await feedbackCollection.add(payload);res.json({ok:true,persisted:true})}
  catch(e){console.error('feedback write failed',e);res.status(500).json({ok:false,error:'storage_failed'})}
});

app.post('/v1/footprint',async(req,res)=>{
  const payload=cleanProgress(req.body);
  if(!payload)return res.status(400).json({ok:false,error:'invalid_payload'});
  if(!collection)return res.status(202).json({ok:true,persisted:false});
  try{await collection.doc(payload.device).set({...payload,serverUpdatedAt:Date.now()},{merge:true});res.json({ok:true,persisted:true})}
  catch(e){console.error('footprint write failed',e);res.status(500).json({ok:false,error:'storage_failed'})}
});

function requireAdmin(req,res,next){
  if(!ADMIN_TOKEN)return res.status(503).json({error:'admin_not_configured'});
  const token=(req.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(token!==ADMIN_TOKEN)return res.status(401).json({error:'unauthorized'});
  next();
}

app.patch('/v1/admin/feedback/:id',requireAdmin,async(req,res)=>{
  if(!feedbackCollection)return res.status(503).json({error:'storage_not_configured'});
  const id=String(req.params.id||'');
  const status=req.body?.status==='done'?'done':'open';
  if(!id)return res.status(400).json({error:'invalid_id'});
  try{await feedbackCollection.doc(id).set({status,handledAt:status==='done'?Date.now():0},{merge:true});res.json({ok:true,status})}
  catch(e){console.error('feedback update failed',e);res.status(500).json({error:'storage_failed'})}
});

app.get('/v1/admin/feedback',requireAdmin,async(_req,res)=>{
  if(!feedbackCollection)return res.json({feedback:[],storage:'not_configured'});
  try{const snap=await feedbackCollection.orderBy('createdAt','desc').limit(100).get();res.json({feedback:snap.docs.map(d=>({id:d.id,...d.data()})),storage:'firestore'})}
  catch(e){console.error('feedback read failed',e);res.status(500).json({error:'storage_failed'})}
});

app.get('/v1/admin/devices',requireAdmin,async(_req,res)=>{
  if(!collection)return res.json({devices:[],storage:'not_configured'});
  try{const snap=await collection.orderBy('opened','desc').limit(50).get();res.json({devices:snap.docs.map(d=>d.data()),storage:'firestore'})}
  catch(e){console.error('admin read failed',e);res.status(500).json({error:'storage_failed'})}
});

app.listen(PORT,()=>console.log('kor-progress-api listening on '+PORT));
