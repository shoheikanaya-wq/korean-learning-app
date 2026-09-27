import express from 'express';

const app=express();
app.use(express.json({limit:'32kb'}));

const PORT=process.env.PORT||8080;
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'https://shoheikanaya-wq.github.io';
const ADMIN_TOKEN=process.env.KOR_ADMIN_TOKEN||'';

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin',ALLOWED_ORIGIN);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
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

// Storage adapter is deliberately disabled until a private datastore is configured.
// This endpoint validates the privacy-minimal payload without persisting it.
app.post('/v1/footprint',(req,res)=>{
  const payload=cleanProgress(req.body);
  if(!payload)return res.status(400).json({ok:false,error:'invalid_payload'});
  res.status(202).json({ok:true,persisted:false});
});

function requireAdmin(req,res,next){
  if(!ADMIN_TOKEN)return res.status(503).json({error:'admin_not_configured'});
  const token=(req.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(token!==ADMIN_TOKEN)return res.status(401).json({error:'unauthorized'});
  next();
}

app.get('/v1/admin/devices',requireAdmin,(_req,res)=>{
  res.json({devices:[],storage:'not_configured'});
});

app.listen(PORT,()=>console.log('kor-progress-api listening on '+PORT));
