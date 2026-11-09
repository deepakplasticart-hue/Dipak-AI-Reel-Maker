const $=id=>document.getElementById(id);let sceneData=[];let currentUrl=null;
const FREE_EXPORT_KEY="dipak_ai_free_export_used_v1";
let premiumActive=false;
const API_BASE=window.DIPAK_API_BASE||"";
function hasUsedFreeExport(){return localStorage.getItem(FREE_EXPORT_KEY)==="yes"}
function updatePlanStatus(){
 const used=hasUsedFreeExport();
 $("planStatus").textContent=premiumActive?"✅ आपका Premium access सक्रिय है।":(used?"आपकी मुफ्त Reel इस्तेमाल हो चुकी है। Premium खरीदें।":"पहली Reel मुफ्त डाउनलोड करें। इसके बाद Premium access की जरूरत होगी।");
 $("export").textContent=premiumActive?"⬇ Premium Reel डाउनलोड करें":(used?"🔒 Premium के लिए भुगतान करें":"⬇ पहली Reel मुफ्त बनाएं");
}
async function checkPremium(){
 const email=$("buyerEmail").value.trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(email)){ $("premiumStatus").textContent="कृपया सही Email address डालें।"; return false; }
 $("premiumStatus").textContent="Razorpay payment जाँचा जा रहा है…";
 try{
  const r=await fetch(`${API_BASE}/api/premium-status?email=${encodeURIComponent(email)}`,{headers:{"Accept":"application/json"}});
  if(!r.ok) throw new Error("server");
  const data=await r.json(); premiumActive=!!data.premium;
  $("premiumStatus").textContent=premiumActive?"✅ Payment verify हो गया। Premium चालू है।":"अभी इस Email पर सफल ₹99 payment नहीं मिला। भुगतान में वही Email इस्तेमाल करें।";
  updatePlanStatus(); return premiumActive;
 }catch(e){ $("premiumStatus").textContent="Payment verification server अभी जुड़ा/deploy नहीं है। README में दिए setup steps पूरे करें।"; return false; }
}
$("checkPremium").onclick=checkPremium;
updatePlanStatus();
function splitStory(s){return s.split(/(?<=[।.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean)}
$("makeScenes").onclick=()=>{const story=$("story").value.trim();if(!story){$("status").textContent="पहले कहानी लिखें।";return}const parts=splitStory(story);sceneData=parts.map((text,i)=>({text,image:null}));renderScenes();$("status").textContent=`${sceneData.length} scenes तैयार हैं। आप हर scene का text बदल सकते हैं और image जोड़ सकते हैं।`};
function renderScenes(){const root=$("scenes");root.innerHTML="";$("sceneCount").textContent=sceneData.length+" scenes";sceneData.forEach((s,i)=>{const box=document.createElement("div");box.className="scene";const left=document.createElement("div");const label=document.createElement("small");label.textContent=`SCENE ${i+1}`;const ta=document.createElement("textarea");ta.value=s.text;ta.oninput=()=>sceneData[i].text=ta.value;left.append(label,ta);const right=document.createElement("div");const img=document.createElement("img");img.alt="Scene image";img.src=s.image||placeholder(i);const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=e=>{const f=e.target.files[0];if(!f)return;s.image=URL.createObjectURL(f);img.src=s.image};right.append(img,input);box.append(left,right);root.append(box)})}
function placeholder(i){return `https://placehold.co/600x900/30285c/ffffff?text=Scene+${i+1}`}
function getVoices(){const voices=speechSynthesis.getVoices();const sel=$("voice");sel.innerHTML='<option value="">डिवाइस की Default आवाज़</option>';voices.forEach((v,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${v.name} (${v.lang})`;sel.append(o)})}if("speechSynthesis"in window){getVoices();speechSynthesis.onvoiceschanged=getVoices}
function speak(text){if(!("speechSynthesis"in window)){alert("इस browser में voice सुविधा उपलब्ध नहीं है।");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=$("lang").value;const v=speechSynthesis.getVoices()[$("voice").value];if(v)u.voice=v;speechSynthesis.speak(u)}
$("listen").onclick=()=>{const t=sceneData.map(s=>s.text).join(" ");if(t)speak(t);else $("status").textContent="पहले Scenes बनाएं।"};
const canvas=$("canvas"),ctx=canvas.getContext("2d");let previewTimer=null;
function drawScene(i){const s=sceneData[i];ctx.fillStyle="#211b45";ctx.fillRect(0,0,canvas.width,canvas.height);if(s.image){const im=new Image();im.onload=()=>{ctx.drawImage(im,0,0,canvas.width,canvas.height);drawCaption(s,i)};im.src=s.image}else{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#5542a6");g.addColorStop(1,"#17152d");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);drawCaption(s,i)}}
function drawCaption(s,i){ctx.fillStyle="#0009";ctx.fillRect(35,canvas.height-360,canvas.width-70,270);ctx.fillStyle="white";ctx.textAlign="center";ctx.font="bold 42px sans-serif";wrapText(s.text,canvas.width/2,canvas.height-270,canvas.width-110,58);ctx.font="bold 25px sans-serif";ctx.fillText(`DIPAK AI REEL MAKER • ${i+1}/${sceneData.length}`,canvas.width/2,canvas.height-55)}
function wrapText(text,x,y,maxWidth,lineHeight){let words=text.split(/\s+/),line="",yy=y;for(let n=0;n<words.length;n++){let test=line+words[n]+" ";if(ctx.measureText(test).width>maxWidth&&n>0){ctx.fillText(line,x,yy);line=words[n]+" ";yy+=lineHeight}else line=test}ctx.fillText(line,x,yy)}
$("preview").onclick=()=>{if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";let i=0;clearInterval(previewTimer);drawScene(0);previewTimer=setInterval(()=>{i=(i+1)%sceneData.length;drawScene(i)},Number($("duration").value)*1000)};
$("export").onclick=async()=>{if(hasUsedFreeExport() && !(await checkPremium())){ $("status").textContent="Premium access के लिए सफल payment जरूरी है। ऊपर Email डालकर भुगतान जाँचें।"; $("payNow").scrollIntoView({behavior:"smooth",block:"center"}); return; } if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";if(!canvas.captureStream||!window.MediaRecorder)return $("status").textContent="आपका browser video export support नहीं करता। Chrome में खोलकर देखें।";clearInterval(previewTimer);$("download").hidden=true;$("status").textContent="वीडियो तैयार हो रहा है… इस tab को खुला रखें।";const stream=canvas.captureStream(25);let chunks=[];let recorder;try{recorder=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9"});}catch(e){recorder=new MediaRecorder(stream)}recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"});if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(blob);const a=$("download");a.href=currentUrl;a.download="dipak-ai-reel.webm";a.textContent="⬇ वीडियो डाउनलोड करें (WEBM)";a.hidden=false;if(!premiumActive)localStorage.setItem(FREE_EXPORT_KEY,"yes");updatePlanStatus();$("status").textContent="आपकी पहली मुफ्त Reel तैयार है। अगली Reel डाउनलोड करने के लिए Premium खरीदें।"};recorder.start();let i=0;const dur=Number($("duration").value)*1000;const step=()=>{drawScene(i);i++;if(i<sceneData.length)setTimeout(step,dur);else setTimeout(()=>recorder.stop(),dur)};step()};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
// Razorpay hosted Payment Link button (no secret key in browser)
$("payNow").onclick=()=>{
 const link=window.RAZORPAY_PAYMENT_LINK||"";
 const validLink=(()=>{try{const u=new URL(link);return u.protocol==="https:" && ["rzp.io","pages.razorpay.com"].includes(u.hostname)}catch{return false}})();
 if(!validLink){
   alert("पहले payment-config.js में अपना Razorpay Payment Link डालें।");
   return;
 }
 window.open(link,"_blank","noopener,noreferrer");
};
