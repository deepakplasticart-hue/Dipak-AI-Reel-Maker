// Dipak AI Reel Maker - Razorpay Payment Link webhook backend
// Never expose RAZORPAY_WEBHOOK_SECRET in browser code.
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const EXPECTED_LINK = process.env.RAZORPAY_PAYMENT_LINK_URL || 'https://rzp.io/rzp/HUTaDH17';
const EXPECTED_AMOUNT = Number(process.env.PAYMENT_AMOUNT_PAISE || 9900);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'paid-customers.json');

function readPaid(){ try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch { return {}; } }
function savePaid(data){ fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true}); fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)); }

// Raw body is required for Razorpay HMAC signature verification.
app.post('/api/razorpay-webhook', express.raw({type:'application/json'}), (req,res)=>{
  if(!WEBHOOK_SECRET) return res.status(500).send('Webhook secret is not configured');
  const signature=req.get('x-razorpay-signature')||'';
  const expected=crypto.createHmac('sha256',WEBHOOK_SECRET).update(req.body).digest('hex');
  const a=Buffer.from(signature,'hex'), b=Buffer.from(expected,'hex');
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(400).send('Invalid signature');
  let event; try { event=JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).send('Invalid JSON'); }
  if(event.event==='payment_link.paid'){
    const link=event.payload?.payment_link?.entity;
    const payment=event.payload?.payment?.entity;
    if(!link || link.status!=='paid' || Number(link.amount)!==EXPECTED_AMOUNT || link.short_url!==EXPECTED_LINK){
      return res.status(200).send('Ignored: link or amount does not match configured product');
    }
    const email=String(link.customer?.email || payment?.email || '').trim().toLowerCase();
    if(!email) return res.status(200).send('Paid event received without customer email');
    const paid=readPaid();
    paid[email]={premium:true,amount_paise:Number(link.amount),payment_link_id:link.id||null,payment_id:payment?.id||null,paid_at:new Date().toISOString()};
    savePaid(paid);
  }
  res.status(200).send('ok');
});

app.use(express.json());
app.get('/api/premium-status',(req,res)=>{
  const email=String(req.query.email||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Valid email required'});
  res.set('Cache-Control','no-store');
  res.json({premium:!!readPaid()[email]?.premium});
});
app.use(express.static(__dirname));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`Dipak AI Reel Maker server listening on ${PORT}`));
