// ayar.js – durak ayarlarının düzeni, sefer hesabı ve yazı <-> ayar çevirileri
// Ayar düzeni (bir durağın bütün kuralları tek nesnede):
// { surum, durakAdi, konumDk, tomtom,
//   gunTurleri:[{id,ad,gunler:[0-6]}],            0=Pazar
//   mevsimler:[{id,ad,aylar:[1-12]}],              boş liste = yaz/kış tuşu yok
//   hatlar:[{id,ad,renk,kalkis,sonSefer,turSuresi,
//            turler:[{id,ad,son}],                  araç türleri ve son kalkış saatleri, ilk tür varsayılan
//            otoTur:{tur,adet,kalan,haric:[id],mevsim:{id:adet}},  "sondan N araç şu tür" kuralı
//            duraklar:[{ad,dk,sadece:[[b,s]],haric:[[b,s]],gps}],  kalkıştan kaç dk sonra
//            tarife:{ <gunTuru> veya <gunTuru>_<mevsim> : {sabit:[saat], bantlar:[{bas,bit,aralik}]}},
//            uzatmalar:[{gunTurleri:[id], haftaGunleri:[0-6], bas, bit, ek:{durakAdi:dk}}],
//            yonler:{g,d}, yolcuDuraklari:[{ad,dk,yon}] }],
//   carpi:{tur:'havuz'|'dakika'|'sefer', ucret, ilkUcret, tolerans, enFazla, kime:'arka'|'yok', bolum, not} }
// Günlük veri (gunler/{tarih}): {gunTuru, mevsim, hatlar:{<hat>:{plakalar,tur,ariza,ortak,yok,yokEk,sabah,bant,uzat,uzatmaYok,gunTuru}}}

const GUN_KISA=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
const AY_KISA=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const sn=(h,m,s=0)=>h*3600+m*60+s;
function saatSn(x){if(typeof x=='number')return x;const p=String(x||'').trim().split(/[:.]/).map(Number);if(p.length<2||p.some(isNaN))return NaN;return sn(p[0],p[1],p[2]||0)}
function fmt(x){x=Math.round(x);const h=Math.floor(x/3600),m=Math.floor(x%3600/60),s=x%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+(s?':'+String(s).padStart(2,'0'):'')}
function dkYaz(d){d=Math.round(d*100)/100;return String(d).replace('.',',')}
function kisaId(s){return String(s||'').toLowerCase().replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'').slice(0,12)||('h'+Date.now().toString(36))}
const gunNo=g=>GUN_KISA.findIndex(k=>k.toLowerCase()==String(g).toLowerCase().slice(0,3).replace('pts','pzt'));

function bosAyar(ad){return {surum:2,durakAdi:ad||'',konumDk:5,tomtom:'',
 gunTurleri:[{id:'hi',ad:'Hafta içi',gunler:[1,2,3,4,5]},{id:'hs',ad:'Hafta sonu',gunler:[0,6]}],mevsimler:[],
 hatlar:[{id:'hat1',ad:'1. hat',renk:'#1e63b8',kalkis:'Kalkış',sonSefer:'22:00',turSuresi:60,turler:[{id:'normal',ad:'Normal',son:'22:00'}],duraklar:[],
  tarife:{hi:{sabit:['06:00'],bantlar:[{bas:'06:00',bit:'22:00',aralik:10}]},hs:{sabit:['07:00'],bantlar:[{bas:'07:00',bit:'22:00',aralik:15}]}},uzatmalar:[],yonler:{g:'Gidiş',d:'Dönüş'},yolcuDuraklari:[]}],
 carpi:{tur:'havuz',ucret:0,ilkUcret:0,tolerans:10,enFazla:60,kime:'arka',bolum:'Hat\\s*No\\s*:',not:''}}}

// --- ayar denetimi: yapıştırılan veride eksik/yanlış varsa Türkçe hata listesi döner
function ayarDenetle(A){
 const H=[];if(!A||typeof A!='object')return ['Ayar boş.'];
 if(!Array.isArray(A.gunTurleri)||!A.gunTurleri.length)H.push('En az bir gün türü olmalı.');
 if(!Array.isArray(A.hatlar)||!A.hatlar.length)H.push('En az bir hat olmalı.');
 const gid=new Set((A.gunTurleri||[]).map(g=>g.id));const hid=new Set();
 (A.hatlar||[]).forEach((h,i)=>{
  const n=(h.ad||(i+1)+'. hat')+': ';
  if(!h.id)H.push(n+'hat kodu yok.');else if(hid.has(h.id))H.push(n+'hat kodu iki kere kullanılmış.');hid.add(h.id);
  if(isNaN(saatSn(h.sonSefer)))H.push(n+'son sefer saati yanlış.');
  if(!Array.isArray(h.turler)||!h.turler.length)H.push(n+'en az bir araç türü olmalı.');
  (h.turler||[]).forEach(t=>{if(isNaN(saatSn(t.son)))H.push(n+t.ad+' son kalkış saati yanlış.')});
  if(h.otoTur&&h.otoTur.tur&&!(h.turler||[]).some(t=>t.id==h.otoTur.tur))H.push(n+'otomatik tür kuralındaki tür ('+h.otoTur.tur+') araç türlerinde yok.');
  for(const g of gid){if(!h.tarife||!(h.tarife[g]||Object.keys(h.tarife).some(k=>k.startsWith(g+'_'))))H.push(n+(A.gunTurleri.find(x=>x.id==g)||{}).ad+' için sefer saatleri yok.')}
  for(const k in (h.tarife||{})){const T=h.tarife[k];(T.sabit||[]).forEach(s=>{if(isNaN(saatSn(s)))H.push(n+'['+k+'] yanlış saat: '+s)});(T.bantlar||[]).forEach(b=>{if(isNaN(saatSn(b.bas))||isNaN(saatSn(b.bit))||!(b.aralik>0))H.push(n+'['+k+'] yanlış aralık satırı: '+b.bas+'-'+b.bit)})}
 });
 return H;
}

// --- gün türü ve mevsim
function otoGunTuru(A,tarih){const g=new Date(tarih+'T12:00').getDay();const x=(A.gunTurleri||[]).find(t=>(t.gunler||[]).includes(g));return x?x.id:(A.gunTurleri[0]||{}).id}
function otoMevsim(A,tarih){if(!A.mevsimler||!A.mevsimler.length)return '';const ay=new Date(tarih+'T12:00').getMonth()+1;const x=A.mevsimler.find(m=>(m.aylar||[]).includes(ay));return x?x.id:A.mevsimler[0].id}
function tarifeBul(h,gt,mv){return (mv&&h.tarife[gt+'_'+mv])||h.tarife[gt]||h.tarife[Object.keys(h.tarife).find(k=>k.startsWith(gt+'_'))]||{sabit:[],bantlar:[]}}

// --- günün aralık değişikliği bantları tarifeye bindirir (günün bandı kazanır)
function bantBirlestir(taban,gunluk){
 const G=(gunluk||[]).map(b=>[saatSn(b.bas),saatSn(b.bit),b.aralik*60]).filter(b=>!isNaN(b[0])&&!isNaN(b[1])&&b[2]>0);
 let L=(taban||[]).map(b=>[saatSn(b.bas),saatSn(b.bit),b.aralik*60]);
 for(const g of G){const Y=[];for(const b of L){if(b[1]<=g[0]||b[0]>=g[1]){Y.push(b);continue}if(b[0]<g[0])Y.push([b[0],g[0],b[2]]);if(b[1]>g[1])Y.push([g[1],b[1],b[2]])}L=Y}
 return L.concat(G).sort((a,b)=>a[0]-b[0]);
}
// K = {gt, mv, gh (günün hat verisi), hg (haftanın günü 0-6), sira (şoförlerin sıradan çıkışları)}
function seferSaatleri(h,K){
 const T=tarifeBul(h,K.gt,K.mv),son=saatSn(h.sonSefer),gh=K.gh||{};
 const sab=(gh.sabah&&gh.sabah.length?gh.sabah:T.sabit)||[];
 const o=sab.map(saatSn).filter(x=>!isNaN(x)).sort((a,b)=>a-b);
 let c=o.length?o[o.length-1]:null;
 for(const b of bantBirlestir(T.bantlar,gh.bant)){
  if(c===null||c<b[0]-b[2]){c=b[0];if(!o.includes(c))o.push(c)}
  for(;;){const n=c+b[2];if(n>b[1]+0.5)break;o.push(n);c=n}
 }
 return [...new Set(o.map(x=>Math.round(x)))].filter(x=>x<=son).sort((a,b)=>a-b);
}
const pencerede=(dep,L)=>(L||[]).some(w=>dep>=saatSn(w[0])&&dep<saatSn(w[1]));
function aktifDuraklar(h,dep){return (h.duraklar||[]).filter(d=>(!d.sadece||!d.sadece.length||pencerede(dep,d.sadece))&&!(d.haric&&pencerede(dep,d.haric)))}
// --- uzatma: o saatte kalkan seferde durakların planına eklenen dakikalar (durak bazında, sonraki duraklara taşınır)
function uzatmaEk(h,K,dep){
 const gh=K.gh||{},ek={};
 const std=gh.uzatmaYok?[]:(h.uzatmalar||[]).filter(u=>(!u.gunTurleri||!u.gunTurleri.length||u.gunTurleri.includes(K.gt))&&(!u.haftaGunleri||!u.haftaGunleri.length||u.haftaGunleri.includes(K.hg)));
 const D=aktifDuraklar(h,dep);
 for(const u of std.concat(gh.uzat||[])){const b=saatSn(u.bas),s=saatSn(u.bit);if(dep<b||dep>=s)continue;
  let tas=0;(D.length?D:[{ad:'_tur'}]).forEach(d=>{if(u.ek&&u.ek[d.ad]!==undefined)tas=+u.ek[d.ad]||0;ek[d.ad]=(ek[d.ad]||0)+tas});
  ek._tur=(ek._tur||0)+(u.ek&&u.ek._tur!==undefined?+u.ek._tur:tas)}
 return ek;
}
// --- o seferin durak saatleri [ad, dk] ve tur süresi (dk)
function seferDuraklari(h,K,dep){
 const ek=uzatmaEk(h,K,dep);
 const D=aktifDuraklar(h,dep).map(d=>[d.ad,(+d.dk||0)+(ek[d.ad]||0)]);
 const tur=D.length?Math.max(D[D.length-1][1],(+h.turSuresi||0)+(ek._tur||0)):(+h.turSuresi||0)+(ek._tur||0);
 if(!D.length||D[D.length-1][1]<tur)D.push([h.kalkis?h.kalkis+' (dönüş)':'Tur sonu',tur]);
 return {D,tur};
}
// --- bir aracın yok aralıkları (kahyanın girdiği + şoförün "sıradan çıktım" kaydı)
function yokAraliklari(gh,sira,p){
 const L=[];const ekle=y=>{if(y&&y.b&&y.s){const b=saatSn(y.b),s=saatSn(y.s);if(!isNaN(b)&&!isNaN(s)&&s>b)L.push([b,s])}};
 ekle((gh.yok||{})[p]);((gh.yokEk||{})[p]||[]).forEach(ekle);
 const S=(sira||{})[p];if(S){ekle(S);(S.ek||[]).forEach(ekle)}
 return L;
}
// --- sıraya göre araç dağıtımı (mevcut uygulamadaki kural):
// araç sırayla döner; türünün son kalkış saatini geçen araç sıradan çıkar;
// yokken sırası gelen araç bekletilir, döndüğünde 5 sefer içinde ilk boş sefere öncelikle girer.
function planHesapla(h,K){
 const G=K.gh||{};const tur=G.tur||{},ariza=G.ariza||{};
 const tipler=h.turler||[];const varsay=(tipler[0]||{}).id;
 const sinir={};tipler.forEach(t=>sinir[t.id]=saatSn(t.son));
 const plakalar=String(G.plakalar||'').split(/[\s,;]+/).filter(x=>x);
 const canli=plakalar.filter(p=>!ariza[p]).map(p=>({p,k:sinir[tur[p]]!==undefined?tur[p]:varsay}));
 const YK={};canli.forEach(c=>{const L=yokAraliklari(G,K.sira,c.p);if(L.length)YK[c.p]=L});
 const yokMu=(p,s)=>!!YK[p]&&YK[p].some(x=>s>=x[0]&&s<x[1]);
 const BK={};const bekle=c=>{BK[c.p]={c,n:0}};
 const yokSec=s=>{let r=null;for(const p in BK){const b=BK[p];if(!r&&!yokMu(p,s)&&b.n<=5&&s<=sinir[b.c.k]){r=b.c;delete BK[p];continue}b.n++;if(b.n>5)delete BK[p]}return r};
 const sf=seferSaatleri(h,K);
 const satir=[],PLAN={},sonC={},say={};let idx=0;
 for(const s of sf){
  let sec=yokSec(s);
  if(!sec)for(let j=0;j<canli.length;j++){const c=canli[(idx+j)%canli.length];if(s<=sinir[c.k]){if(yokMu(c.p,s)){bekle(c);continue}sec=c;idx=(idx+j+1)%canli.length;break}}
  if(!sec){satir.push({s,p:null});continue}
  const p=sec.p;say[p]=(say[p]||0)+1;let gec=0;
  if(sonC[p]!==undefined){const donus=sonC[p]+seferDuraklari(h,K,sonC[p]).tur*60;if(donus>s)gec=Math.ceil((donus-s)/60)}
  sonC[p]=s;(PLAN[p]=PLAN[p]||[]).push(s);satir.push({s,p,n:say[p],gec});
 }
 return {satir,PLAN,canli,sonC,say,YK};
}
// --- "sondan N araç şu tür, kalanı şu tür" kuralı (hariç tutulan türlere dokunmaz)
function otoTurAta(h,gh,mv){
 const R=h.otoTur;if(!R||!R.tur)return false;
 const N=+(((R.mevsim||{})[mv])||R.adet||0);const har=new Set(R.haric||[]);
 gh.tur=gh.tur||{};const ar=gh.ariza||{};
 const pl=String(gh.plakalar||'').split(/[\s,;]+/).filter(p=>p&&!ar[p]&&!har.has(gh.tur[p]));
 pl.forEach((p,i)=>{gh.tur[p]=(pl.length-i)<=N?R.tur:(R.kalan||R.tur)});return true;
}

// --- ayar -> yazı (düzenleme kutuları için) ve yazı -> ayar
const GT_YAZ=A=>(A.gunTurleri||[]).map(g=>g.id+' = '+g.ad+': '+(g.gunler||[]).map(x=>GUN_KISA[x]).join(' ')).join('\n');
function GT_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{const m=x.match(/^([^=]+)=([^:]+):?(.*)$/);if(!m)throw 'Gün türü satırı anlaşılmadı: '+x;
 const gun=m[3].split(/[\s,]+/).filter(y=>y).map(gunNo);if(gun.includes(-1))throw 'Gün adı anlaşılmadı: '+x;return {id:m[1].trim(),ad:m[2].trim(),gunler:gun}})}
const MV_YAZ=A=>(A.mevsimler||[]).map(m=>m.id+' = '+m.ad+': '+(m.aylar||[]).map(x=>AY_KISA[x-1]).join(' ')).join('\n');
function MV_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{const m=x.match(/^([^=]+)=([^:]+):?(.*)$/);if(!m)throw 'Mevsim satırı anlaşılmadı: '+x;
 const ay=m[3].split(/[\s,]+/).filter(y=>y).map(y=>AY_KISA.findIndex(k=>k.toLowerCase()==y.toLowerCase().slice(0,3))+1);if(ay.includes(0))throw 'Ay adı anlaşılmadı: '+x;return {id:m[1].trim(),ad:m[2].trim(),aylar:ay}})}
const TUR_YAZ=h=>(h.turler||[]).map(t=>t.id+' = '+t.ad+': '+t.son).join('\n');
function TUR_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{const m=x.match(/^([^=]+)=([^:]+):\s*([\d:.]+)$/);if(!m)throw 'Araç türü satırı anlaşılmadı: '+x;return {id:m[1].trim(),ad:m[2].trim(),son:m[3].trim()}})}
const pen=L=>L.map(w=>w[0]+'-'+w[1]).join(',');
const penOku=s=>s.split(',').map(x=>x.trim()).filter(x=>x).map(x=>{const q=x.match(/^([\d:.]+)\s*-\s*([\d:.]+)$/);if(!q)throw 'Saat aralığı anlaşılmadı: '+x;return [q[1],q[2]]});
const DUR_YAZ=h=>(h.duraklar||[]).map(d=>d.ad+': '+dkYaz(d.dk)+(d.sadece&&d.sadece.length?' @'+pen(d.sadece):'')+(d.haric&&d.haric.length?' !'+pen(d.haric):'')+(d.gps?' [gps: '+d.gps+']':'')).join('\n');
function DUR_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{
 let gps='';x=x.replace(/\[gps:\s*([^\]]*)\]/i,(a,g)=>{gps=g.trim();return ''}).trim();
 const m=x.match(/^(.+?):\s*([\d.,]+)\s*(?:([@!])\s*(.+))?$/);if(!m)throw 'Durak satırı anlaşılmadı: '+x+' (örnek: Metrobüs: 30)';
 const d={ad:m[1].trim(),dk:+m[2].replace(',','.')};if(m[3]=='@')d.sadece=penOku(m[4]);if(m[3]=='!')d.haric=penOku(m[4]);if(gps)d.gps=gps;return d})}
const YD_YAZ=h=>(h.yolcuDuraklari||[]).map(d=>d.ad+': '+dkYaz(d.dk)+' '+(d.yon||'g')).join('\n');
function YD_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{const m=x.match(/^(.+?):\s*([\d.,]+)\s*([gd])?$/i);if(!m)throw 'Yolcu durağı satırı anlaşılmadı: '+x+' (örnek: Eczane: 20 g)';return {ad:m[1].trim(),dk:+m[2].replace(',','.'),yon:(m[3]||'g').toLowerCase()}})}
function TAR_YAZ(h){return Object.keys(h.tarife||{}).map(k=>{const T=h.tarife[k];return '['+k+']\nsabit: '+(T.sabit||[]).join(' ')+'\n'+(T.bantlar||[]).map(b=>b.bas+'-'+b.bit+' '+dkYaz(b.aralik)).join('\n')}).join('\n\n')}
function TAR_OKU(t){const R={};let k=null;t.split('\n').map(x=>x.trim()).filter(x=>x).forEach(x=>{
 let m=x.match(/^\[(.+)\]$/);if(m){k=m[1].trim();R[k]={sabit:[],bantlar:[]};return}
 if(!k)throw 'Saatlerden önce gün türünü [hi] gibi yaz.';
 m=x.match(/^sabit:?\s*(.*)$/i);if(m){R[k].sabit=m[1].split(/[\s,]+/).filter(y=>y);R[k].sabit.forEach(s=>{if(isNaN(saatSn(s)))throw 'Yanlış saat: '+s});return}
 m=x.match(/^([\d:.]+)\s*-\s*([\d:.]+)\s+([\d.,]+)/);if(m){R[k].bantlar.push({bas:m[1],bit:m[2],aralik:+m[3].replace(',','.')});return}
 throw 'Saat satırı anlaşılmadı: '+x});return R}
const BANT_YAZ=L=>(L||[]).map(b=>b.bas+'-'+b.bit+' '+dkYaz(b.aralik)).join('\n');
function BANT_OKU(t){return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{const m=x.match(/^([\d:.]+)\s*-\s*([\d:.]+)\s+([\d.,]+)/);if(!m)throw 'Aralık satırı anlaşılmadı: '+x+' (örnek: 08:30-16:30 7)';return {bas:m[1],bit:m[2],aralik:+m[3].replace(',','.')}})}
const UZ_YAZ=(L,gtli)=>(L||[]).map(u=>(gtli?([...(u.gunTurleri||[]),...(u.haftaGunleri||[]).map(x=>GUN_KISA[x])].join(',')||'hepsi')+' ':'')+u.bas+'-'+u.bit+' '+Object.entries(u.ek||{}).map(([a,d])=>a+'='+dkYaz(d)).join(', ')).join('\n');
function UZ_OKU(t,gtli,ids){ids=ids||[];return t.split('\n').map(x=>x.trim()).filter(x=>x).map(x=>{let gt=[],hg=[];if(gtli){const i=x.indexOf(' ');const ilk=x.slice(0,i);x=x.slice(i+1).trim();if(ilk!='hepsi')ilk.split(',').forEach(y=>{const n=gunNo(y);if(!ids.includes(y)&&n>=0)hg.push(n);else gt.push(y)})}
 const m=x.match(/^([\d:.]+)\s*-\s*([\d:.]+)\s+(.+)$/);if(!m)throw 'Uzatma satırı anlaşılmadı: '+x;const ek={};
 m[3].split(',').map(y=>y.trim()).filter(y=>y).forEach(y=>{const q=y.match(/^(.+?)\s*[=+]\s*([\d.,]+)$/);if(!q)throw 'Uzatma durağı anlaşılmadı: '+y+' (örnek: Metrobüs=2)';ek[q[1].trim()]=+q[2].replace(',','.')});
 const r={bas:m[1],bit:m[2],ek};if(gtli){r.gunTurleri=gt;if(hg.length)r.haftaGunleri=hg}return r})}
