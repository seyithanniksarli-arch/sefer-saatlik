# Sefer Sırası – satılık sürüm kurulumu

Bu sürüm şu an kullandığın BL-105 uygulamasından tamamen ayrıdır. Ona dokunmaz.

## Dosyalar
- `index.html`: Uygulamanın sayfası.
- `app.js`: Girişler, şoför ekranı, kahya ekranı ve sahip paneli.
- `ayar.js`: Sefer hesabı ve durak ayarlarının düzeni.
- `carpi.js`: Çarpı hesabı. GPS raporu (PDF) ya da elle girilen gecikmelerle çalışır.
- `harita.js`: Durak haritası. Durak konumları ve canlı araçlar burada görünür.
- `ogren.js`: Trafik öğrenen sistem. Şoförlerin telefon konumundan gerçek durak-arası süreleri öğrenir, ortanca süreyi tahmin olarak kullanır.
- `yolcu.html`: Yolcu sayfası. Adresi `yolcu.html?d=DURAKKODU`, QR afişleri için sonuna `&qr` eklenir.
- `config.js`: **Sadece bunu doldurursun.** İçine Firebase bilgileri ve senin e-postan yazılır.
- `firestore.rules`: Güvenlik kuralları. Her durak yalnızca kendi verisini görür.
- `ornek-ayar-BL105.json`: Örnek ayar. Kahya ekranında "Ayarları yapıştır" ile yüklenebilir.
- `sofor-ikon.svg` ve `sofor-ikon.png`: Logolar.

## 1. Firebase projesi (bir kere yapılır)
1. console.firebase.google.com adresinde **yeni bir proje** aç. Mevcut sefer-ca13e projesini kullanma.
2. **Authentication → Sign-in method** bölümünde iki yöntemi aç: **Anonymous** (şoförler için) ve **Email/Password** (kahyalar ve senin için).
3. **Authentication → Users → Add user** ile kendine bir hesap aç: senin e-postan ve bir şifre.
4. **Firestore Database → Create database** ile veritabanını oluştur. Konum olarak `eur3` seç.
5. **Firestore → Rules** sekmesine `firestore.rules` dosyasının içeriğini yapıştır. `SAHIP_EPOSTA` yazan yere kendi e-postanı yaz ve **Publish**'e bas.
6. **Proje ayarları → Web uygulaması ekle** ile çıkan bilgileri `config.js` dosyasına yapıştır. `SAHIP_EPOSTA` yerine aynı e-postayı yaz.

## 2. Yayınlama
Dosyaların hepsini yeni bir GitHub deposuna yükle ve GitHub Pages'i aç.
Daha sonra Google Play ve App Store'a da bu dosyalar paketlenecek.

## 3. Yeni durak satınca
1. Uygulamada **Uygulama sahibi** bağlantısına bas ve kendi e-postanla gir.
2. **Yeni durak** bölümünde durak kodunu ve adını yaz. Şoförler bu kodla girecek, örnek: `TEPECIK`.
3. **Kahya hesabı aç** bölümünde durak kodunu, kullanıcı adını ve şifreyi yaz. Bilgileri kahyaya ver.
4. Kahya, **Kahya girişi** ile girer.
   - **Durak ayarları** bölümünden hatları, saatleri, durakları, uzatmaları ve çarpıyı girer.
   - Ya da hazır ayarı **Ayarları yapıştır** ile tek seferde yükler.
5. Şoförler **Şoför girişi** ile girer.
   - Durak kodunu ve plakasını yazıp onay ister.
   - Kahya, **📱 Telefonlar** bölümünden onaylar.

## Güvenlik kurallarını güncellemek
`firestore.rules` dosyası her değiştiğinde içeriğini Firebase'de **Firestore → Rules** sekmesine yapıştırıp **Publish**'e bas.

> **Önemli (trafik öğrenen sistem):** Bu sürümle `firestore.rules` dosyasına `ogren` bölümü eklendi. Daha önce kurulmuş bir Firebase projesinde **kuralları yeniden Publish et**. Yapmazsan uygulama bozulmaz ama süreler öğrenilmez, yolcu sayfası plana göre çalışmaya devam eder.

## Trafik öğrenen sistem
- Şoförün telefonu takipteyken durak konumundan geçişleri algılar (120 m girişte, 150 m çıkışta). Durak konumları kahyanın haritada işaretlediği konumlardır (**Durak haritası**). İşaretsiz durakta öğrenme olmaz.
- Süreler her hat için `duraklar/KOD/ogren/HATKODU` belgesinde ortak toplanır. Hafta içi ve hafta sonu (Cumartesi+Pazar) ayrı tutulur.
- Bir durak arası için en az 5 örnek birikince ortanca süre kullanılır. Yetmezse sefer planı kullanılır.
- Yolcu sayfası öğrenilmiş süreleri kullanır. Şoför ekranında TomTom anahtarı varsa sıra: öğrenilmiş süre, TomTom, plan.

## Durak ayarlarını hazır yazdırmak
Durağın bilgilerini Claude'a anlat: hatlar, gün türleri, sefer saatleri ve aralıkları, duraklar ve dakikaları, uzatmalar, araç türleri, çarpı kuralı.
Claude bunları `ornek-ayar-BL105.json` düzeninde yazar. Kahya ekranında **Ayarları yapıştır** ile yüklersin.
