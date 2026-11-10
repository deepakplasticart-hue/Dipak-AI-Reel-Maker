DIPAK AI REEL MAKER — Razorpay Webhook Verification Build

IS BUILD MEIN KYA HAI
- Pehli Reel free export (browser local storage based).
- Free export ke baad Premium export ke liye server par payment status check.
- Buyer checkout mein jo Email deta hai, app mein wahi Email daal kar “भुगतान जाँचें” dabaye.
- Server Razorpay ke signed payment_link.paid webhook ko verify karta hai.
- Sirf configured Payment Link aur ₹99 (9900 paise) ka fully-paid event Premium activate karta hai.
- Secret key/webhook secret frontend files mein nahi hai.

BAHUT ZAROORI: ABHI LIVE NAHI HAI
Yeh ZIP backend code taiyar karta hai, lekin automatic unlock tabhi chalega jab ise Node.js hosting par deploy karke Razorpay webhook configure karenge. Sirf ZIP ko static hosting par upload karne se backend nahi chalega. Maine aapke Razorpay account mein login/deploy nahi kiya hai.

DEPLOYMENT (Node.js hosting, jaise Render/Railway/VPS)
1. ZIP extract karke poora Dipak_AI_Reel_Maker folder GitHub ya Node.js hosting par deploy karein.
2. Build command: npm install
3. Start command: npm start
4. Hosting par Environment Variables set karein:
   RAZORPAY_WEBHOOK_SECRET = Razorpay dashboard mein banaya gaya webhook secret
   RAZORPAY_PAYMENT_LINK_URL = https://rzp.io/rzp/HUTaDH17
   PAYMENT_AMOUNT_PAISE = 9900
   DATA_FILE = /var/data/paid-customers.json (persistent disk attach karne ke baad)
5. Hosting ka HTTPS domain milne ke baad Razorpay Dashboard > Account & Settings > Webhooks mein jaayein.
6. Webhook URL set karein: https://YOUR-DOMAIN/api/razorpay-webhook
7. Wahi secret set karein jo hosting ke RAZORPAY_WEBHOOK_SECRET mein hai.
8. Event mein sirf payment_link.paid select karein aur Save karein.
9. Hosting par persistent disk zaroor attach karein aur DATA_FILE ko us disk par rakhein, warna redeploy/restart par paid record mit sakta hai.
10. Test payment/webhook karke verify karein. Live customers ke liye Live Mode payment link aur webhook credentials hi use karein.

CUSTOMER FLOW
1. Customer app mein Pay Now dabata hai.
2. Razorpay checkout par apna Email deta hai aur ₹99 pay karta hai.
3. Razorpay signed webhook server ko payment_link.paid bhejta hai.
4. Server signature, exact link, paid status aur amount verify karke Email ko Premium list mein save karta hai.
5. Customer app par lautkar wahi Email daalta hai aur “भुगतान जाँचें” dabata hai.
6. Premium active hone par agle exports allowed hote hain.

SECURITY / LIMITATIONS
- Razorpay Webhook Secret kabhi kisi ko chat mein na bhejein aur frontend ZIP mein na rakhein.
- App mein Email lookup basic activation hai, full customer login/OTP nahi. Kisi doosre vyakti ko Email pata ho to woh us paid Email se access check kar sakta hai. Public commercial launch se pehle OTP/login aur per-user server-side export/download authorization add karna chahiye.
- Free-download limit browser local storage par hai; ise clear karke bypass kiya ja sakta hai.
- Existing app video generation browser-based WEBM export hai; actual AI image/video generation included nahi hai.
- Payment link par customer email collect hona zaroori hai. Razorpay Payment Link settings mein customer email required/collected rakhein.

PAYMENT LINK
https://rzp.io/rzp/HUTaDH17
Configured price: ₹99 (9900 paise). Agar link ka amount ₹99 nahi hai, hosting par PAYMENT_AMOUNT_PAISE ko actual amount ke mutabik badlein.

LATEST UI UPDATE (Nov 2026)
- Added custom Dipak Reel Maker SVG logo (header + app icon).
- Export duration selector now offers 30 sec / 1 min / 90 sec total duration.
- Added gentle image zoom animation during export.
- Razorpay hosted payment link and webhook backend were preserved.
- Honest current limitation: no Gemini AI generation integrated yet; scene images are uploaded by user. Speech is browser preview only and is not recorded into exported WEBM. MP4/audio narration integration requires a later implementation. This build does not call any paid AI API.
