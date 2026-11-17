/* ekle.js - "Ana ekrana ekle" yonlendirme bandi + adim adim animasyon.
   Bagimsiz tek dosya: kendi CSS'ini enjekte eder, global degisken olusturmaz.
   Sayfa tarayicida acilmissa gosterir; ana ekrandan/APK'dan aciliyorsa,
   masaustu genis ekranda, &qr sayfasinda ve baskida gostermez. */
(function () {
  'use strict';
  try {
    var W = window, D = document, ua = navigator.userAgent || '';

    /* ---------- gosterme kosullari ---------- */
    var mm = function (q) { try { return W.matchMedia(q).matches; } catch (e) { return false; } };
    if (mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || navigator.standalone === true) return;
    if (/; wv\)/.test(ua) || (/Version\/[\d.]+/.test(ua) && /Chrome\//.test(ua) && /\bwv\b/.test(ua))) return;
    if (W.innerWidth >= 900 && !mm('(pointer: coarse)')) return;
    try { if (new URLSearchParams(location.search).has('qr')) return; } catch (e) { if (/[?&]qr(=|&|$)/.test(location.search)) return; }

    var iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
    if (iOS && !/Safari/.test(ua)) return; /* iOS WebView */
    var iosDisi = iOS && /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser|Brave/.test(ua);

    var seg = (location.pathname.split('/').pop() || '').toLowerCase();
    var YOLCU = seg.indexOf('yolcu') > -1;
    var K_SOFOR = 'ekleGizle_sofor', K_YOLCU = 'ekleGoruldu_yolcu', K_OTURUM = 'ekleKapat';

    var ls = function (op, k, v) { try { return op === 'g' ? W.localStorage.getItem(k) : W.localStorage.setItem(k, v); } catch (e) { return null; } };
    var ss = function (op, k, v) { try { return op === 'g' ? W.sessionStorage.getItem(k) : W.sessionStorage.setItem(k, v); } catch (e) { return null; } };

    if (YOLCU) { if (ls('g', K_YOLCU)) return; }
    else { if (ls('g', K_SOFOR) || ss('g', K_OTURUM)) return; }

    /* ---------- beforeinstallprompt ---------- */
    var oneri = null, simdiBtn = null;
    W.addEventListener('beforeinstallprompt', function (e) {
      try { e.preventDefault(); } catch (x) {}
      oneri = e;
      if (simdiBtn) simdiBtn.hidden = false;
    });

    var serit = null, kutu = null, bosluk = null, kapali = false;

    function kaldir() {
      kapali = true;
      [serit, kutu, bosluk].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
      serit = kutu = bosluk = null;
    }
    W.addEventListener('appinstalled', function () { kaldir(); });

    /* ---------- simge ve ad ---------- */
    function simgeUrl() {
      var l = D.querySelector('link[rel="apple-touch-icon"]') || D.querySelector('link[rel="apple-touch-icon-precomposed"]') ||
        D.querySelector('link[rel~="icon"]');
      return l ? l.href : '';
    }
    function uygAdi() {
      var m = D.querySelector('meta[name="apple-mobile-web-app-title"]');
      var t = (m && m.content) || D.title || 'Uygulama';
      return t.length > 22 ? t.slice(0, 21) + '…' : t;
    }

    /* ---------- CSS ---------- */
    var css = [
      '.ek-serit,.ek-serit *,.ek-kutu,.ek-kutu *{box-sizing:border-box}',
      '.ek-serit{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:45;display:flex;align-items:center;gap:8px;',
      'background:#10202e;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px 6px 8px 12px;font:600 14px/1.25 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif;',
      'box-shadow:0 6px 22px rgba(0,0,0,.35);max-width:560px;margin:0 auto;cursor:pointer;animation:ekYuk .45s ease-out both;-webkit-tap-highlight-color:transparent}',
      '.ek-serit .ek-m{flex:1;min-width:0}',
      '.ek-serit.ek-yolcu{font-size:13.5px;padding:6px 6px 6px 12px}',
      '.ek-serit button{font:inherit;cursor:pointer;border:0;margin:0;width:auto;flex:none;text-transform:none;letter-spacing:normal;box-shadow:none;-webkit-tap-highlight-color:transparent}',
      '.ek-serit .ek-nasil{background:#ffcf33;color:#10202e;font-weight:800;border-radius:10px;padding:9px 10px;min-height:36px;white-space:nowrap}',
      '.ek-serit .ek-x{background:transparent;padding:0;display:flex;align-items:center;justify-content:center;color:#c9d4de;font-size:22px;line-height:1;width:36px;height:36px;border-radius:10px}',
      '@keyframes ekYuk{from{transform:translateY(130%);opacity:0}to{transform:none;opacity:1}}',

      '.ek-kutu{position:fixed;inset:0;z-index:2147483000;background:rgba(8,16,24,.62);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto;font:16px/1.35 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}',
      '.ek-kart{background:#fff;color:#10202e;width:100%;max-width:360px;border-radius:20px;padding:16px 16px 14px;box-shadow:0 14px 50px rgba(0,0,0,.45);margin:auto;max-height:100%;overflow:auto}',
      '.ek-kart h2{margin:0 0 10px;font-size:19px;font-weight:900;text-align:center;letter-spacing:-.2px}',
      '.ek-ipucu{background:#fff4cc;color:#5a4300;border-radius:10px;padding:8px 10px;font-size:14px;font-weight:600;margin:0 0 10px}',
      '.ek-kart .ek-bt{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
      '.ek-kart button{font:inherit;margin:0;text-transform:none;letter-spacing:normal;box-shadow:none;font-weight:800;border:0;border-radius:12px;padding:12px;min-height:46px;cursor:pointer;width:100%}',
      '.ek-kart .ek-simdi{background:#1fa36a;color:#fff;font-size:18px;min-height:54px}',
      '.ek-kart .ek-simdi[hidden]{display:none}',
      '.ek-kart .ek-anla{background:#10202e;color:#fff}',
      '.ek-kart .ek-bir{background:transparent;color:#5b6b7a;font-weight:700;font-size:14px;min-height:38px;text-decoration:underline}',

      '.ek-ph{position:relative;width:196px;height:252px;margin:0 auto;border:5px solid #1b2a36;border-radius:28px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.25);color:#10202e;font:600 10px/1.2 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}',
      '.ek-sc{position:absolute;inset:0;opacity:0;animation:ekS 4.8s linear infinite;--d:0s}',
      '.ek-sc:nth-child(2){animation-delay:-3.6s;--d:-3.6s}.ek-sc:nth-child(3){animation-delay:-2.4s;--d:-2.4s}.ek-sc:nth-child(4){animation-delay:-1.2s;--d:-1.2s}',
      '@keyframes ekS{0%{opacity:0}4%{opacity:1}22%{opacity:1}25%{opacity:0}100%{opacity:0}}',
      '.ek-bar{position:absolute;left:0;right:0;top:0;height:30px;background:#eceff3;display:flex;align-items:center;gap:6px;padding:0 8px}',
      '.ek-url{flex:1;height:16px;border-radius:8px;background:#fff;border:1px solid #d5dde5}',
      '.ek-d3{display:flex;flex-direction:column;gap:2.5px;width:16px;align-items:center;font-style:normal}',
      '.ek-d3 u{display:block;width:3.5px;height:3.5px;border-radius:50%;background:#10202e}',
      '.ek-pg{position:absolute;left:10px;right:10px;top:42px}',
      '.ek-pg .ek-hd{display:flex;gap:7px;align-items:center;margin-bottom:10px}',
      '.ek-pg .ek-hd img,.ek-pg .ek-hd .ek-ph0{width:28px;height:28px;border-radius:8px;object-fit:cover;background:#1fa36a}',
      '.ek-ln{height:8px;border-radius:4px;background:#dfe5ea;margin-bottom:7px}',
      '.ek-cd{height:30px;border-radius:9px;background:#e8f4ee;margin-bottom:8px}',
      '.ek-dim{position:absolute;inset:0;background:rgba(0,0,0,.32)}',
      '.ek-menu{position:absolute;right:6px;top:30px;width:128px;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.35);padding:3px 0;transform-origin:100% 0;animation:ekMn 4.8s linear infinite;animation-delay:var(--d)}',
      '@keyframes ekMn{0%{transform:scale(.6);opacity:0}5%{transform:scale(1);opacity:1}100%{transform:scale(1);opacity:1}}',
      '.ek-r{padding:6px 10px;font-size:10px;color:#34424f;white-space:nowrap}',
      '.ek-r.ek-hot{background:#ffe27a;color:#10202e;font-weight:900;animation:ekGlow 4.8s linear infinite;animation-delay:var(--d)}',
      '@keyframes ekGlow{0%,6%{background:#fff}12%,20%{background:#ffd23d;box-shadow:inset 0 0 0 2px #e0a800}22%,100%{background:#ffd23d}}',
      '.ek-dlg{position:absolute;left:14px;right:14px;top:62px;background:#fff;border-radius:12px;box-shadow:0 6px 22px rgba(0,0,0,.4);padding:10px}',
      '.ek-dlg b{display:block;font-size:11px;font-weight:900;margin-bottom:8px}',
      '.ek-fld{display:flex;align-items:center;gap:7px;margin-bottom:10px}',
      '.ek-fld img,.ek-fld .ek-ph0{width:30px;height:30px;border-radius:8px;object-fit:cover;background:#1fa36a;flex:none}',
      '.ek-fld span{flex:1;border-bottom:2px solid #1fa36a;padding:4px 0;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
      '.ek-bts{display:flex;justify-content:flex-end;gap:8px}',
      '.ek-bts span{padding:6px 10px;border-radius:8px;font-weight:800;color:#5b6b7a}',
      '.ek-bts span.ek-ok{background:#1fa36a;color:#fff;animation:ekOk 4.8s linear infinite;animation-delay:var(--d)}',
      '@keyframes ekOk{0%,8%{box-shadow:0 0 0 0 rgba(31,163,106,.7)}16%{box-shadow:0 0 0 6px rgba(31,163,106,0)}100%{box-shadow:0 0 0 0 rgba(31,163,106,0)}}',
      '.ek-home{position:absolute;inset:0;background:linear-gradient(160deg,#1e63b8,#16507e 55%,#0f8a57);padding:26px 12px 0}',
      '.ek-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 8px}',
      '.ek-g i{display:block;aspect-ratio:1;border-radius:11px;background:rgba(255,255,255,.22)}',
      '.ek-new{position:relative;text-align:center;color:#fff;font-size:8.5px;font-weight:800;text-shadow:0 1px 3px rgba(0,0,0,.6)}',
      '.ek-new img,.ek-new .ek-ph0{display:block;width:100%;aspect-ratio:1;border-radius:11px;object-fit:cover;background:#1fa36a;margin-bottom:3px;animation:ekPop 4.8s linear infinite;animation-delay:var(--d);box-shadow:0 0 0 0 rgba(255,226,122,.9)}',
      '@keyframes ekPop{0%,2%{transform:scale(0);opacity:0}9%{transform:scale(1.28);opacity:1;box-shadow:0 0 0 7px rgba(255,226,122,.75)}14%{transform:scale(1);box-shadow:0 0 0 2px rgba(255,226,122,.9)}22%,100%{transform:scale(1);opacity:1;box-shadow:0 0 0 2px rgba(255,226,122,.9)}}',
      '.ek-new span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ek-par{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(16,32,46,.55);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);animation:ekTap 4.8s linear infinite;animation-delay:var(--d)}',
      '.ek-par::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid rgba(255,210,61,.95);opacity:0;animation:ekRing 4.8s linear infinite;animation-delay:var(--d)}',
      '@keyframes ekTap{0%,6%{transform:scale(1.15);opacity:0}9%{opacity:1;transform:scale(1)}13%{transform:scale(.78)}17%{transform:scale(1);opacity:1}22%,100%{opacity:1;transform:scale(1)}}',
      '@keyframes ekRing{0%,12%{opacity:0;transform:scale(.6)}14%{opacity:1;transform:scale(1)}22%{opacity:0;transform:scale(2.2)}100%{opacity:0}}',
      /* iOS */
      '.ek-sbar{position:absolute;left:0;right:0;bottom:0;height:34px;background:#f2f3f5;border-top:1px solid #d5dde5;display:flex;justify-content:space-around;align-items:center}',
      '.ek-sbar i{display:block;width:14px;height:14px;border:2px solid #3b82f6;border-radius:4px;font-style:normal}',
      '.ek-sbar i.ek-sh{border:0;position:relative;width:16px;height:16px;border-radius:0;animation:ekGlow2 4.8s linear infinite;animation-delay:var(--d)}',
      '.ek-sh::before{content:"";position:absolute;left:1px;right:1px;bottom:0;height:10px;border:2px solid #3b82f6;border-radius:3px}',
      '.ek-sh::after{content:"";position:absolute;left:6px;top:-2px;width:2px;height:12px;background:#3b82f6;box-shadow:-3px 3px 0 0 #3b82f6,3px 3px 0 0 #3b82f6}',
      '@keyframes ekGlow2{0%,6%{filter:none}12%,100%{filter:drop-shadow(0 0 4px #ffd23d)}}',
      '.ek-sheet{position:absolute;left:0;right:0;bottom:0;height:170px;background:#f2f3f5;border-radius:14px 14px 0 0;padding:8px;animation:ekSh 4.8s linear infinite;animation-delay:var(--d)}',
      '@keyframes ekSh{0%{transform:translateY(100%)}7%{transform:none}100%{transform:none}}',
      '.ek-sheet .ek-r{background:#fff;border-radius:7px;margin-bottom:3px;padding:8px 10px}',
      '.ek-ios-top{display:flex;justify-content:space-between;align-items:center;font-weight:900;margin-bottom:10px;font-size:10px}',
      '.ek-ios-top span{color:#3b82f6;padding:4px 7px;border-radius:7px}',
      '.ek-ios-top span.ek-ok{background:#3b82f6;color:#fff;animation:ekOk 4.8s linear infinite;animation-delay:var(--d)}',

      '.ek-cap{position:relative;height:46px;margin:12px 0 4px;text-align:center}',
      '.ek-cap span{position:absolute;left:0;right:0;top:0;opacity:0;font-size:16px;font-weight:800;line-height:1.25;animation:ekS 4.8s linear infinite}',
      '.ek-cap span:nth-child(2){animation-delay:-3.6s}.ek-cap span:nth-child(3){animation-delay:-2.4s}.ek-cap span:nth-child(4){animation-delay:-1.2s}',
      '.ek-cap em{display:inline-block;width:20px;height:20px;line-height:20px;border-radius:50%;background:#1fa36a;color:#fff;font-style:normal;font-size:12px;margin-right:6px;vertical-align:1px}',
      '.ek-dots{display:flex;gap:6px;justify-content:center}',
      '.ek-dots i{width:18px;height:5px;border-radius:3px;background:#d5dde5;animation:ekDt 4.8s linear infinite}',
      '.ek-dots i:nth-child(2){animation-delay:-3.6s}.ek-dots i:nth-child(3){animation-delay:-2.4s}.ek-dots i:nth-child(4){animation-delay:-1.2s}',
      '@keyframes ekDt{0%{background:#1fa36a}24%{background:#1fa36a}26%,100%{background:#d5dde5}}',
      '.ek-liste{display:none;margin:0;padding:0 0 0 22px;font-size:16px;font-weight:700}',
      '.ek-liste li{margin:0 0 9px}',

      '@media (prefers-color-scheme:dark){.ek-kart{background:#17232f;color:#eef2f5}.ek-ipucu{background:#4a3a08;color:#ffe9a3}.ek-kart .ek-anla{background:#eef2f5;color:#10202e}.ek-kart .ek-bir{color:#9db0c0}.ek-dots i{background:#3a4a58}@keyframes ekDt{0%{background:#1fa36a}24%{background:#1fa36a}26%,100%{background:#3a4a58}}}',
      '@media (prefers-reduced-motion:reduce){.ek-serit{animation:none}.ek-ph,.ek-cap,.ek-dots{display:none}.ek-liste{display:block}.ek-sc,.ek-menu,.ek-par,.ek-new img,.ek-sheet{animation:none!important}}',
      '@media print{.ek-serit,.ek-kutu{display:none!important}}'
    ].join('');

    /* ---------- animasyon isaretlemesi ---------- */
    var ik = '<img class="ek-ic" alt="">';
    function sayfa() {
      return '<div class="ek-pg"><div class="ek-hd">' + ik + '<div style="flex:1"><div class="ek-ln" style="width:70%"></div><div class="ek-ln" style="width:45%;margin:0"></div></div></div>' +
        '<div class="ek-cd"></div><div class="ek-cd"></div><div class="ek-ln" style="width:90%"></div><div class="ek-ln" style="width:75%"></div></div>';
    }
    function ana() {
      var h = '<div class="ek-home"><div class="ek-g"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
        '<div class="ek-new">' + ik + '<span class="ek-ad"></span></div><i></i><i></i><i></i></div></div>';
      return '<div class="ek-sc">' + h + '</div>';
    }
    var adim = iOS ? [
      'Alttaki <b>Paylaş</b> düğmesine dokun',
      '<b>“Ana Ekrana Ekle”</b> satırını seç',
      'Sağ üstteki <b>“Ekle”</b>ye dokun',
      'Telefonunun ana ekranında yeni simge belirir'
    ] : [
      'Sağ üstteki <b>üç nokta</b> menüsüne dokun',
      '<b>“Ana ekrana ekle”</b> satırını seç',
      '<b>“Ekle”</b> düğmesine dokun',
      'Telefonunun ana ekranında yeni simge belirir'
    ];

    function telefon() {
      var a, b, c;
      if (iOS) {
        a = '<div class="ek-sc">' + sayfa() + '<div class="ek-sbar"><i></i><i></i><i class="ek-sh"></i><i></i><i></i></div><div class="ek-par" style="left:50%;bottom:6px;top:auto;margin-top:0;transform-origin:center;margin-bottom:0;margin-left:-4px;bottom:1px"></div></div>';
        b = '<div class="ek-sc">' + sayfa() + '<div class="ek-dim"></div><div class="ek-sheet"><div class="ek-r">Kopyala</div><div class="ek-r">Yer İşareti Ekle</div><div class="ek-r">Sık Kullanılanlara Ekle</div><div class="ek-r ek-hot">Ana Ekrana Ekle</div><div class="ek-r">Yazdır</div>' +
          '<div class="ek-par" style="left:86%;top:110px"></div></div></div>';
        c = '<div class="ek-sc"><div class="ek-dim" style="background:#f2f3f5"></div><div style="position:absolute;left:10px;right:10px;top:16px"><div class="ek-ios-top"><span>İptal</span><span style="color:#10202e">Ana Ekrana Ekle</span><span class="ek-ok">Ekle</span></div>' +
          '<div class="ek-dlg" style="position:static;box-shadow:none;border:1px solid #d5dde5"><div class="ek-fld" style="margin:0">' + ik + '<span class="ek-ad"></span></div></div></div>' +
          '<div class="ek-par" style="right:14px;top:36px;left:auto;margin-right:-13px"></div></div>';
      } else {
        a = '<div class="ek-sc"><div class="ek-bar"><div class="ek-url"></div><i class="ek-d3"><u></u><u></u><u></u></i></div>' + sayfa() + '<div class="ek-par" style="left:166px;top:27px"></div></div>';
        b = '<div class="ek-sc"><div class="ek-bar"><div class="ek-url"></div><i class="ek-d3"><u></u><u></u><u></u></i></div>' + sayfa() + '<div class="ek-menu"><div class="ek-r">Yeni sekme</div><div class="ek-r">Geçmiş</div><div class="ek-r">İndirilenler</div><div class="ek-r ek-hot">Ana ekrana ekle</div><div class="ek-r">Paylaş…</div></div>' +
          '<div class="ek-par" style="left:166px;top:117px"></div></div>';
        c = '<div class="ek-sc"><div class="ek-bar"><div class="ek-url"></div><i class="ek-d3"><u></u><u></u><u></u></i></div>' + sayfa() + '<div class="ek-dim"></div><div class="ek-dlg"><b>Ana ekrana ekle</b><div class="ek-fld">' + ik + '<span class="ek-ad"></span></div><div class="ek-bts"><span>İptal</span><span class="ek-ok">Ekle</span></div></div>' +
          '<div class="ek-par" style="left:166px;top:158px"></div></div>';
      }
      var p = '<div class="ek-ph" aria-hidden="true">' + a + b + c + ana() + '</div>';
      var cap = '<div class="ek-cap" aria-hidden="true">' + adim.map(function (t, i) { return '<span><em>' + (i + 1) + '</em>' + t + '</span>'; }).join('') + '</div>';
      var dots = '<div class="ek-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
      var liste = '<ol class="ek-liste">' + adim.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>';
      return p + cap + dots + liste;
    }

    /* ---------- modal ---------- */
    var onceOdak = null;
    function modalAc() {
      if (kutu || kapali) return;
      onceOdak = D.activeElement;
      kutu = D.createElement('div');
      kutu.className = 'ek-kutu';
      kutu.innerHTML = '<div class="ek-kart" role="dialog" aria-modal="true" aria-label="Ana ekrana ekle">' +
        '<h2>' + (iOS ? 'iPhone’da ana ekrana ekle' : 'Ana ekrana ekle') + '</h2>' +
        (iosDisi ? '<p class="ek-ipucu">Bu tarayıcıda ekleme çalışmayabilir. Bağlantıyı <b>Safari’de aç</b> ve aşağıdaki adımları orada uygula.</p>' : '') +
        telefon() +
        '<div class="ek-bt"><button type="button" class="ek-simdi" hidden>Şimdi ekle</button>' +
        '<button type="button" class="ek-anla">Anladım</button>' +
        '<button type="button" class="ek-bir">Bir daha gösterme</button></div></div>';
      D.body.appendChild(kutu);
      var u = simgeUrl(), ad = uygAdi();
      Array.prototype.forEach.call(kutu.querySelectorAll('.ek-ic'), function (im) {
        if (u) { im.src = u; im.onerror = function () { im.removeAttribute('src'); im.className = 'ek-ph0'; }; } else im.className = 'ek-ph0';
      });
      Array.prototype.forEach.call(kutu.querySelectorAll('.ek-ad'), function (s) { s.textContent = ad; });
      simdiBtn = kutu.querySelector('.ek-simdi');
      if (oneri && !iOS) simdiBtn.hidden = false;
      simdiBtn.addEventListener('click', function () {
        var o = oneri; if (!o) return;
        try {
          o.prompt();
          Promise.resolve(o.userChoice).then(function (r) {
            oneri = null; simdiBtn.hidden = true;
            if (r && r.outcome === 'accepted') kaldir();
          }, function () {});
        } catch (e) {}
      });
      kutu.querySelector('.ek-anla').addEventListener('click', function () { ss('s', K_OTURUM, '1'); kaldir(); geriOdak(); });
      kutu.querySelector('.ek-bir').addEventListener('click', function () { ls('s', YOLCU ? K_YOLCU : K_SOFOR, '1'); kaldir(); geriOdak(); });
      kutu.addEventListener('click', function (e) { if (e.target === kutu) modalKapat(); });
      try { kutu.querySelector('.ek-anla').focus(); } catch (e) {}
    }
    function modalKapat() { if (kutu && kutu.parentNode) kutu.parentNode.removeChild(kutu); kutu = null; simdiBtn = null; geriOdak(); }
    function geriOdak() { try { if (onceOdak && onceOdak.focus && D.body.contains(onceOdak)) onceOdak.focus(); } catch (e) {} }
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && kutu) modalKapat(); });

    /* ---------- serit ---------- */
    function seritGoster() {
      if (kapali || serit || !D.body) return;
      if (YOLCU) ls('s', K_YOLCU, '1'); /* gosterildigi anda yaz: bir daha cikmaz */
      serit = D.createElement('div');
      serit.className = 'ek-serit' + (YOLCU ? ' ek-yolcu' : '');
      serit.setAttribute('role', 'region');
      serit.setAttribute('aria-label', 'Ana ekrana ekle');
      serit.innerHTML = '<span class="ek-m">' + (YOLCU ? '📲 Ana ekrana ekle' : '📲 Ana ekrana ekle, tek dokunuşla aç') + '</span>' +
        '<button type="button" class="ek-nasil">Nasıl?</button><button type="button" class="ek-x" aria-label="Kapat">×</button>';
      D.body.appendChild(serit);
      /* icerigi ortmesin: sayfa sonuna serit kadar bosluk */
      bosluk = D.createElement('div');
      bosluk.setAttribute('aria-hidden', 'true');
      bosluk.style.cssText = 'height:' + (serit.offsetHeight + 16) + 'px;pointer-events:none';
      D.body.appendChild(bosluk);
      serit.querySelector('.ek-x').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!YOLCU) ss('s', K_OTURUM, '1');
        kaldir();
      });
      serit.addEventListener('click', function () { modalAc(); });
    }

    function basla() {
      var st = D.createElement('style');
      st.textContent = css;
      (D.head || D.documentElement).appendChild(st);
      setTimeout(function () { try { seritGoster(); } catch (e) {} }, 1200);
    }
    if (D.body) basla(); else D.addEventListener('DOMContentLoaded', basla);
  } catch (err) { /* sessizce gec: sayfayi asla bozma */ }
})();
