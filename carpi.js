// carpi.js – çarpı hesabı: GPS raporu (PDF) ya da elle girilen gecikmelerden, durağın çarpı kuralına göre
// Kural (durak ayarları > Çarpı kuralı):
//  havuz : her aracın gecikmeleri tolerans havuzunda birikir, havuz dolduktan sonraki her geç sefer 1 çarpı
//  sefer : toleransı aşan her geç sefer 1 çarpı
//  dakika: toleransı aşan her dakika için ücret
//  İlk servis ücreti > 0 ise günün ilk seferinde gecikme ayrıca ücretlenir. Ortak↓ işaretli araç alttakiyle birlikte sayılır.
let CRP={txt:null,haric:{},okunan:[],kaynak:''};
const anahtar=p=>String(p).replace(/\D/g,'')||String(p);
function carpiKural(){return Object.assign({tur:'havuz',ucret:0,ilkUcret:0,tolerans:10,enFazla:60,kime:'arka',bolum:'Hat\\s*No\\s*:'},A.carpi||{})}
function carpiOzet(){const C=carpiKural();
 const t=C.tur=='dakika'?'Toleransı ('+dkYaz(C.tolerans)+' dk) aşan her dakika <b>'+C.ucret+' TL</b>':C.tur=='sefer'?'Toleransı ('+dkYaz(C.tolerans)+' dk) aşan her geç sefer <b>'+C.ucret+' TL</b>':'Gecikmeler '+dkYaz(C.tolerans)+' dakikalık havuzda birikir, havuz dolunca her geç sefer <b>'+C.ucret+' TL</b>';
 return t+(C.ilkUcret?', ilk serviste gecikme <b>'+C.ilkUcret+' TL</b>':'')+(C.kime=='arka'?'. Çarpıyı sıradaki arka araç alır.':'.')+(C.not?'<br><span class="kucuk">'+esc(C.not)+'</span>':'')}
function carpiHtml(h){
 return '<details class="bolum" data-k="carpi"'+ac('carpi')+'><summary>Çarpı hesabı</summary><p style="font-size:16px">'+carpiOzet()+'</p>'+
  '<label>GPS raporu (PDF)</label><input type="file" accept="application/pdf" onchange="carpiPdfOku(this.files[0])" style="width:100%">'+
  '<label>Ya da gecikmeleri elle yaz</label><textarea id="carpiElle" placeholder="74 08:15 6\n03 09:30 4,5" style="min-height:70px"></textarea><p class="kucuk">Her satır: <b>plaka sefer_saati gecikme_dakikası</b>. Hesap '+esc(h.ad)+' hattı ve '+new Date(TARIH+'T12:00').toLocaleDateString('tr-TR')+' listesine göre yapılır.</p>'+
  '<button class="ana kir" onclick="carpiHesapla()">Çarpıyı hesapla</button><div id="carpiSonuc"></div></details>'}
async function pdfMetin(f){
 if(!window.pdfjsLib){await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
 const doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let t='';
 for(let i=1;i<=doc.numPages;i++){const c=await (await doc.getPage(i)).getTextContent();t+=c.items.map(x=>x.str).join(' ')+' '}return t}
async function carpiPdfOku(f){if(!f)return;const el=$('carpiSonuc');el.innerHTML='<p>PDF okunuyor…</p>';
 try{CRP.txt=await pdfMetin(f);CRP.haric={};CRP.kaynak=f.name;carpiHesapla()}catch(e){el.innerHTML='<p class="uyar">PDF okunamadı. İnternet bağlantısı gerekli.</p>'}}
const gecYuvarla=d=>d<60?0:Math.floor(d/30)/2;
function rxKac(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s*')}
// GPS metninden araç başına [durak, saniye] olayları
function gpsOlaylari(txt,h){
 const C=carpiKural(),adlar=[];const ekle=(ad,asil)=>{if(ad)adlar.push([ad,asil])};
 ekle(h.kalkis,'_kalkis');(h.duraklar||[]).forEach(d=>{ekle(d.ad,d.ad);String(d.gps||'').split('|').map(x=>x.trim()).filter(x=>x).forEach(g=>ekle(g,d.ad))});
 adlar.sort((a,b)=>b[0].length-a[0].length);if(!adlar.length)return {};
 const rx=new RegExp('('+adlar.map(a=>rxKac(a[0])).join('|')+')\\s*(\\d\\d):(\\d\\d):(\\d\\d)','gi');
 let bol;try{bol=new RegExp(C.bolum,'i')}catch(e){bol=/Hat\s*No\s*:/i}
 const O={};for(const parca of txt.split(new RegExp(bol.source,'gi')).slice(1)){
  const pm=parca.match(/^\s*([^\s-]+)/);if(!pm)continue;const k=anahtar(pm[1]);const L=O[k]=O[k]||[];
  for(const m of parca.matchAll(rx)){const tm=(+m[2])*3600+(+m[3])*60+(+m[4]);if(!tm)continue;const ad=adlar.filter(x=>new RegExp('^'+rxKac(x[0])+'$','i').test(m[1])).map(x=>x[1]);if(ad.length)L.push([[...new Set(ad)],tm])}}
 return O;
}
function carpiHesapla(){
 const el=$('carpiSonuc');if(!el)return;const h=hatAyar(),K=kBul(h),P=planHesapla(h,K),C=carpiKural();
 if(!P.canli.length){el.innerHTML='<p class="uyar">Bu gün için '+esc(h.ad)+' listesi yok.</p>';return}
 const AD={};P.canli.forEach(c=>AD[anahtar(c.p)]=c.p);const PL={};for(const p in P.PLAN)PL[anahtar(p)]=P.PLAN[p];
 const SIR=P.canli.map(c=>anahtar(c.p));const EV={};CRP.okunan=[];
 const olay=(k,x,enb,kaynak)=>{const hk=k+'@'+x;let o=CRP.okunan.find(z=>z.k==hk);if(!o){o={k:hk,p:k,x,enb:0,ilk:PL[k]&&PL[k][0]===x,kaynak};CRP.okunan.push(o)}o.enb=Math.max(o.enb,enb)};
 // GPS
 if(CRP.txt){const O=gpsOlaylari(CRP.txt,h);
  for(const k in O){const L=PL[k];if(!L)continue;
   for(const [adlar,tm] of O[k]){let en=null,ef=1e9,ead=null;
    for(const ad of adlar)for(const x of L){const {D}=seferDuraklari(h,K,x);const dk=ad=='_kalkis'?0:((D.find(d=>d[0]==ad)||[])[1]);if(dk===undefined)continue;const fark=tm-(x+dk*60);if(fark<-600||fark>(C.enFazla+30)*60)continue;if(Math.abs(fark)<Math.abs(ef)){ef=fark;en=x;ead=ad}}
    if(en!==null)olay(k,en,ead=='_kalkis'?0:gecYuvarla(ef),'gps')}}}
 // elle
 const hatali=[];($('carpiElle')||{value:''}).value.split('\n').map(z=>z.trim()).filter(z=>z).forEach(z=>{const m=z.match(/^(\S+)\s+([\d:.]+)\s+([\d.,]+)/);if(!m){hatali.push(z);return}const k=anahtar(m[1]),L=PL[k],s=saatSn(m[2]);if(!L||isNaN(s)){hatali.push(z);return}
  const x=L.reduce((a,b)=>Math.abs(b-s)<Math.abs(a-s)?b:a,L[0]);olay(k,x,+m[3].replace(',','.'),'elle')});
 if(!CRP.okunan.length&&!hatali.length){el.innerHTML='<p class="kucuk">GPS raporu yükle ya da gecikmeleri elle yaz.</p>';return}
 for(const o of CRP.okunan){if(CRP.haric[o.k]||o.enb<=0||o.enb>C.enFazla)continue;(EV[o.p]=EV[o.p]||[]).push(o)}
 // ortak araçlar birlikte
 const gh=K.gh||{},ORT={};for(const p in (gh.ortak||{}))if(gh.ortak[p])ORT[anahtar(p)]=1;
 const birim=[];for(let i=0;i<SIR.length;){if(ORT[SIR[i]]&&i+1<SIR.length){birim.push([SIR[i],SIR[i+1]]);i+=2}else{birim.push([SIR[i]]);i++}}
 let tb='<table><tr><th>Araç</th><th>'+(C.tur=='havuz'?'Havuz':'Geç sefer')+'</th><th>Çarpı</th><th>Tutar</th><th>Geç kalınan seferler</th></tr>',top=0,topTL=0;const kk=[];
 for(const u of birim){const ev=[].concat(...u.map(k=>EV[k]||[])).sort((a,b)=>a.x-b.x);if(!ev.length)continue;
  let kul=0,carpi=0,ilkC=0,tl=0;const det=[];
  for(const e of ev){const on=u.length>1?esc(AD[e.p]||e.p)+' – ':'';let not='';
   if(e.ilk&&C.ilkUcret>0&&e.enb>(C.tur=='havuz'?0:C.tolerans)){ilkC++;tl+=C.ilkUcret;not=' – İLK SERVİS ÇARPISI';if(C.tur=='havuz')kul=Math.min(C.tolerans,kul+e.enb)}
   else if(C.tur=='havuz'){if(kul+e.enb<=C.tolerans)kul+=e.enb;else{kul=C.tolerans;carpi++;tl+=C.ucret;not=' – ÇARPI'}}
   else if(C.tur=='sefer'){if(e.enb>C.tolerans){carpi++;tl+=C.ucret;not=' – ÇARPI'}}
   else{const dk=Math.max(0,e.enb-C.tolerans);if(dk>0){carpi+=dk;tl+=dk*C.ucret;not=' – '+dkYaz(dk)+' dk çarpı'}}
   det.push(on+fmt(e.x)+' seferi: '+dkYaz(e.enb)+' dk geç'+not)}
  top+=carpi+ilkC;topTL+=tl;
  const ai=SIR.indexOf(u[u.length-1]),arka=C.kime=='arka'&&SIR.length>u.length?SIR[(ai+1)%SIR.length]:'';
  const ad=u.map(k=>esc(AD[k]||k)).join(' + ');if(tl&&arka)kk.push(ad+' → '+esc(AD[arka]||arka)+': '+tl+' TL');
  tb+='<tr'+(tl?' class="uyari"':'')+'><td><b>'+ad+'</b>'+(u.length>1?' (ortak)':'')+'</td><td>'+(C.tur=='havuz'?dkYaz(kul)+' / '+dkYaz(C.tolerans)+' dk':ev.length)+'</td><td>'+(C.tur=='dakika'?dkYaz(carpi)+' dk':carpi+ilkC)+(ilkC?' ('+ilkC+' ilk)':'')+'</td><td>'+tl+' TL'+(arka&&tl?' → '+esc(AD[arka]||arka):'')+'</td><td class="kucuk">'+det.join('<br>')+'</td></tr>'}
 tb+='</table>';
 const g={};CRP.okunan.forEach(o=>(g[o.p]=g[o.p]||[]).push(o));
 let ok='<details class="bolum" style="box-shadow:none;border:1px solid #edf0f3"><summary style="font-size:17px">Okunan seferler – say / sayma ('+CRP.okunan.length+')</summary><p class="kucuk">İşaretini kaldırdığın sefer hesaba girmez.</p>';
 for(const k in g){ok+='<div style="margin-top:8px;font-weight:800">'+esc(AD[k]||k)+'</div>';g[k].sort((a,b)=>a.x-b.x).forEach(o=>{ok+='<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:16px;font-weight:600;color:'+(CRP.haric[o.k]?'#9fb0c3':'var(--lac)')+'"><input type="checkbox" style="width:22px;height:22px"'+(CRP.haric[o.k]?'':' checked')+' onchange="CRP.haric[\''+o.k+'\']=!this.checked;carpiHesapla()">'+fmt(o.x)+(o.ilk?' (ilk servis)':'')+' – '+(o.enb>C.enFazla?dkYaz(o.enb)+' dk, sayılmıyor':(o.enb>0?dkYaz(o.enb)+' dk geç':'zamanında'))+(o.kaynak=='elle'?' · elle':'')+'</label>'})}
 ok+='</details>';
 el.innerHTML=(hatali.length?'<p class="uyar">Anlaşılmayan satırlar: '+hatali.map(esc).join(' · ')+'</p>':'')+'<h3>'+esc(h.ad)+' – '+new Date(TARIH+'T12:00').toLocaleDateString('tr-TR')+'</h3>'+tb+'<p><b>Toplam: '+(C.tur=='dakika'?dkYaz(top)+' dk':top+' çarpı')+', '+topTL+' TL</b></p>'+(kk.length?'<h3>Kim kime veriyor</h3><p>'+kk.join('<br>')+'</p>':'')+ok+
  '<button class="ana kir" onclick="carpiYazdir()">Çarpıları PDF olarak al</button>'+(CRP.txt?'<details><summary class="kucuk">GPS metni (kontrol için)</summary><pre style="white-space:pre-wrap;font-size:11px">'+esc(CRP.txt.slice(0,1500))+'</pre></details>':'');
}
function carpiYazdir(){const el=$('carpiSonuc'),tb=el&&el.querySelector('table');if(!tb){alert('Önce hesapla.');return}
 const bas='Çarpı Raporu – '+esc(A._ad+' – '+hatAyar().ad)+' – '+new Date(TARIH+'T12:00').toLocaleDateString('tr-TR');const w=window.open('','_blank');if(!w){alert('Açılır pencereye izin ver');return}
 w.document.write('<html><head><meta charset="utf-8"><title>'+bas+'</title><style>@page{size:A4 portrait;margin:10mm}body{font-family:Arial,sans-serif}h2{font-size:18px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #444;padding:5px;text-align:left;vertical-align:top}th{background:#1fa36a;color:#fff}tr.uyari td{background:#fbebeb}</style></head><body><h2>'+bas+'</h2>'+tb.outerHTML+[...el.querySelectorAll(':scope>p,:scope>h3')].map(x=>x.outerHTML).join('')+'</body></html>');w.document.close();w.focus();setTimeout(()=>w.print(),400)}
