# Ahde Vefa — Uygulama ve Tasarım Planı

## Amaç

“Yanlışlıktan değil, yalnızlıktan. Birbirinin yükünü hafifletmeye çalışan yol arkadaşları.” yaklaşımıyla, mobil ve masaüstünde kullanılabilen güvenli bir dijital dergâh oluşturmak. Kullanıcının `docs/specification.md` şartnamesi ürün kapsamının kaynağıdır. İlk teslimin Aşama 1 ve 2 kapsamı kullanıcı tarafından 22 Kasım 2026 tarihinde onaylanmıştır. Aynı gün kullanıcı kalan krediyle Aşama 3–6 dahil bütün kapsamın geliştirilmesini açıkça onaylamıştır.

## Uygulama yaklaşımı

- Next.js App Router, TypeScript ve Tailwind CSS ile modüler responsive web uygulaması; mobilde alt navigasyon, masaüstünde sol menü.
- PostgreSQL, kimlik doğrulama, dosya depolama ve gerçek zamanlı iletişim için kullanıcının seçtiği Supabase kullanılır. Manus yönetilen MySQL veya farklı bir kimlik sağlayıcısı yerine geçirilmez.
- Supabase Auth e-posta/şifre akışları, oturum yenileme, giriş/çıkış ve oturumsuz görünüm; rol kaynağı istemci veya kullanıcı tarafından değiştirilebilir profil alanı değil güvenli veritabanı yetkilendirmesidir.
- Tüm uygulama tabloları için başlangıçtan RLS, foreign key ve indeksler içeren migration dosyaları hazırlanır. İstemciye hiçbir service-role anahtarı gönderilmez.
- Hassas kayıtlar varsayılan olarak sahibine özeldir. Hoca erişimi hem aktif hoca–derviş bağlantısına hem kayıt/modül bazında geri alınabilir izne bağlıdır. Yönetici rolü özel günlük ve mesajlara genel okuma izni vermez.
- Özel dosyalar private storage bucket ve erişim denetimli kısa ömürlü signed URL kullanır. Rol değişimleri ve başvuru onayları veritabanındaki doğrulanmış yetkilere bağlı işlemlerle gerçekleştirilir.
- PWA manifest ve uygulama ikonları uygulamaya aittir. Hassas API yanıtları ve özel sayfalar offline cache'e alınmaz.

## Aşamalar ve teslim kapsamı

### İlk teslim: Aşama 1 ve Aşama 2 (hazır kaynak kod)

**Aşama 1:** Next.js kurulumu, veritabanı migrationları, dört rol, Supabase kayıt ve giriş, yetkilendirme, ana tasarım ve tüm ana menü sayfalarının iskeleti. Üyeler normal üye olarak başlar; hoca ve yönetici rolü kendi kendine seçilemez. Supabase bağlı değilse uygulama bunu açıkça bildirir ve gerçek oturum/kayıt oluşturmaz.

**Aşama 2:** Derviş kişisel odası; tarih/saatli hâl kaydı, günlük/haftalık/aylık görünüm ve 24 saat çizelgesi; beş vakit namaz, diğer ibadetler, kaza/nafile ayrımı ve kullanıcı listeleri; kişisel vird hedefleri ve günlük kayıtlar; özel rüya defteri ve hocayla kayıt bazlı paylaşım/geri alma; özel muhasebe ve kişisel sorular; geçmiş güne dönülebilen birleşik manevî takvim. Oluşturma, düzenleme ve silme işlemleri ilgili kayıt türüne uygulanır.

İlk teslimde henüz tamamlanmayan sonraki aşama sayfaları ve işlevleri açıkça belirtilir. Sahte kullanıcı oturumu, çalışanmış gibi sunulan mesajlar veya kalıcı saklanmayan hassas kayıtlar kullanılmaz.

### Rutinlerim — günlük işler ve alışkanlık takibi

Giriş yapmış her üye için ayrı bir `/routines` sayfası bulunur. Kullanıcı görev veya alışkanlık oluşturabilir; başlık, not, başlangıç/bitiş tarihi, tek seferlik-günlük-hafta içi-haftalık-aylık tekrar, haftanın günleri, renk ve hedef tekrar alanlarını düzenleyebilir veya planı arşivleyebilir. Haftalık ve aylık takvim görünümü seçili günün planlarını gösterir; tamamlanma kayıtları ayrı `routine_logs` satırlarında tutulur. Günlük/haftalık özet, plan ilerleme oranı, son yedi gün ve ardışık gün serisi hesaplanır. `routines` ve `routine_logs` tabloları yalnızca sahibine açık RLS politikalarıyla `20261123010000_routines.sql` migration’ında tanımlanır.

### Aşama 3 — Hoca paneli

Hocalar listesi, bağlantı başvuruları, kabul/ret, birden fazla hoca mimarisi ve tek hocalı başlangıç; hoca kendi bağlı dervişleriyle sınırlıdır. Derviş listesi, verilen vazifeler ve kayıtları, izinle paylaşılan kayıtlar ve görüşme notları. Yöneticinin hoca onayı ve güvenli rol yönetimi.

### Aşama 4 — Sosyal alan

Dergâh akışı, yazı/fotoğraf/hikâye/kıssa/soru/tefekkür/ses/duyuru türleri; herkese açık, yalnız hocama ve yalnız kendime gizliliği. Genel akışta sadece herkese açık içerikler. Beğeni, yorum/yanıt, kaydetme ve şikâyet. Kardeşlik alanında dua talepleri, dertleşme, destek, engelleme ve diğer kullanıcıların kimliği göremediği isteğe bağlı anonim paylaşım. Gelecekte grup görünürlüğünü destekleyen mimari.

### Aşama 5 — İletişim

Supabase Realtime üzerinden üyelik doğrulamalı konuşmalar, metin, uygulama içinde ses kaydı, dosya ekleri, geçmiş ve okundu bilgisi. Yeni mesaj/ses, bağlantı onayı, vazife ve hatırlatma, yorum/yanıt, sohbet/derse ait bildirimler ve kişisel bildirim tercihleri. Yönetici mesajları otomatik okuyamaz.

### Aşama 6 — İçerik ve topluluk kaynakları

Hocaların yazılı/sesli/video sohbet, hikâye, menkıbe, kıssa, duyuru ve ders yayınlaması; istenen kategori ve kaynak/eser bilgileri. Kütüphanede kitap/PDF/makale/ses/ders notu/kaynak metin, arama ve filtreleme, telif/izin alanları. Etkinlikler. Kendine, hocaya veya dervişe mektup, ileri tarihli teslim ve arşivleme.

## Güvenlik kapsamı

- `profiles`, `roles`, `teachers`, `teacher_applications`, `teacher_students`, `posts`, `comments`, `likes`, `stories`, `messages`, `message_attachments`, `mood_entries`, `prayer_entries`, `worship_entries`, `wirds`, `wird_logs`, `dreams`, `self_reflections`, `assignments`, `assignment_logs`, `conversations`, `conversation_members`, `library_items`, `lessons`, `events`, `letters`, `notifications`, `reports`, `privacy_permissions` tabloları; ihtiyaç oldukça ek destek tabloları.
- Özel veri erişimi API ve veritabanında doğrulanır; frontend görünürlüğü yetkilendirme değildir. Her module ait RLS kararları migrationlarda bulunur.
- Rate limiting, oturum güvenliği, doğrulanmış giriş verileri, engelleme/şikâyet, veri dışa aktarma ve güvenli hesap silme ilgili aşamalarla tamamlanır.
- Canlı kullanıma geçiş öncesi harici Supabase projesinde migrationların uygulanması, Auth e-posta ve yönlendirme ayarları ile Storage/Realtime yapılandırmasının tamamlanması gerekir. Bağlantı bilgileri korumalı sır kartı üzerinden istenir; migration canlı veritabanına körlemesine uygulanmaz.

## Proje yapısı

- `src/app/`: Next.js layout, ana sayfa, giriş/kayıt ve modül rotaları; sunucu API uçları.
- `src/components/ui/`: form, buton, diyalog, durum ve bildirim gibi tekrar kullanılan bileşenler.
- `src/components/layout/`: masaüstü sol menü, mobil alt navigasyon, başlık ve uygulama çerçevesi.
- `src/features/`: auth, yolculuk, ibadet, vird, rüya, muhasebe ve sonraki aşama modülleri.
- `src/lib/supabase/`: browser/server istemcileri, oturum ve güvenli veri erişimi.
- `src/lib/`: doğrulama, tarih ve ortak yardımcılar.
- `supabase/migrations/`: sürümlenmiş PostgreSQL şema ve RLS migrationları.
- `public/`: marka görselleri, PWA ikonları, manifest ve güncel `manus-routes.json`.
- `docs/`: Supabase kurulum talimatları, güvenlik kararları ve teslim edilen/henüz açık özellikler.
- `plan.md`, `TODO.md`: onaylanan kapsam ve teslim durumları.

## Tasarım

Kullanıcının sade, huzurlu, ağırbaşlı ve modern; koyu orman yeşili, kırık beyaz, eskitilmiş altın ve taş grisi yönlendirmesi esas alınır.

- **Tasarım hareketi:** Çağdaş editoryal tasarım ile Osmanlı kütüphane ve el yazması estetiğinin ölçülü birleşimi; klasik sosyal medya yoğunluğu kullanılmaz.
- **Temel ilkeler:** Bol nefes alan kompozisyon, okunabilir tipografi, sakin hiyerarşi, mahremiyetin görünür olması.
- **Renk felsefesi:** Kırık beyaz bir kâğıt hissi verir; koyu orman yeşili güven ve sükûnetin taşıyıcısıdır. Eskitilmiş altın yalnız vurgu, ince çizgiler ve marka detaylarında kullanılır. Taş grisi ikincil metinleri dengeler.
- **Yerleşim:** Masaüstünde dar, koyu yeşil sol menü ve onun yanında geniş editoryal ana içerik; kişisel oda içinde odak sütunu ve daha dar günlük özet sütunu. Mobilde içerik tek akışa dönüşür, ana eylemler erişilebilir alt navigasyonla desteklenir. Karmaşık merkezî KPI dashboard'u oluşturulmaz.
- **İmza öğeleri:** İnce kemer/kitap ayracı formu, küçük altın ayırıcılar, alıntı ve günlük notlarında kâğıt tonlu yüzeyler. İkonlar işlevsel ve sınırlıdır.
- **Etkileşim:** Sessiz ve açık geri bildirim; gizlilik seçeneği kayda yakın; hedeflerde kıyas veya liderlik tablosu yerine kişisel ilerleme. Kullanıcıyı suçlayıcı streak mekanikleri yoktur.
- **Animasyon:** Yalnız odak, renk ve menü geçişlerinde 120–180 ms; sürekli, parallax veya gereksiz hareket yok. `prefers-reduced-motion` korunur.
- **Tipografi:** Başlıklarda Türkçe karakterleri destekleyen zarif bir serif (ör. Cormorant Garamond); gövde ve formlarda Manrope veya eşdeğer okunabilir sans-serif. Gövde en az 16 px, büyük başlıklar nefesli, satır uzunlukları kontrollüdür.
- **Marka özü:** Manevî yolculuğunu mahremiyetle sürdüren insanların yan yana yürüdüğü dijital dergâh. Kişilik: şefkatli, ağırbaşlı, güvenilir.
- **Marka sesi:** Emir vermeyen, yakın ve sakin. Örnekler: “Bugün gönlünüz nasıl?” ve “Bu kayıt yalnızca size ait. Paylaşmaya siz karar verirsiniz.”
- **Logo:** İnce kemer ve içindeki iki eşlik eden çizgiyle yol arkadaşlığını anlatan küçük bir marka alanı; serif Ahde Vefa kelime işareti. İleride profesyonel marka kimliğiyle değiştirilebilir.
- **İmza rengi:** Koyu orman yeşili `#173D32`.

## Çalıştırma ve teslim akışı

Onaydan sonra `TODO.md` oluşturulur. Paket yöneticisi ve lifecycle izinleri sabitlenir; TypeScript tanılama kaydı uygulama kodundan önce doğrulanır. Bağımlılıklar kurulur, anlamlı arayüz oluşturulur, uygulama `0.0.0.0:3000` üzerinde platformun `runtime/dev-commands` mekanizmasıyla çalıştırılır. Next.js için bağımlılık kurulumu, üretim derlemesi ve başlangıç komutu olan bir Dockerfile hazırlanır; sağlık endpoint'i oturumsuz başarı yanıtı verir. Route manifest kaynak rotalarla eşleşir. Doğrulama sonunda teslim edilen aşamalar checkpoint olarak `origin/main` üzerinde kaydedilir. Yayınlama ayrı bir kullanıcı kontrollü adımdır; Preview canlı yayın değildir.

## Tam kapsam geliştirme turu — 22 Kasım 2026

Tüm altı aşama artık bu teslim kapsamındadır. Birinci migration değiştirilmeden korunur; kalan modüller yeni sürümlü migration ile açılır. Hoca başvurusu/onayı ve rol geçişleri, admin moderasyonu, sosyal gizlilik ve anonim kimlik ayrımı, konuşma üyeliği ve dosya erişimi veritabanı işlevleri/RLS ile atomik korunur. Gerçek zamanlı iletişim Supabase Realtime kaynaklı sunucu SSE akışıyla httpOnly oturumu korur. İleri tarihli mektuplar ve vazife hatırlatmaları uygulamaya ait Supabase PostgreSQL/pg_cron mekanizmasıyla işlenir; kurulum dosyası etkinleştirilmeden zamanlayıcı çalışıyor denmez. Bildirimler uygulama içidir; yeni bir harici SMS/e-posta/push sağlayıcısı seçilmez.

Kod parçaları ortak API/veritabanı sözleşmesiyle çakışmayan dosyalarda paralel geliştirilir. Beş geliştirme sorumlusu ve bir salt okunur entegrasyon incelemesi tek sınırlı iş akışında çalışır. Orkestrasyon bütçesi agent çağrısı sayısıdır, kredi garantisi değildir. Geçersiz Supabase bağlantısı ve migrationın henüz uygulanmaması canlı Auth/CRUD/Realtime testlerini engeller; bu engel gizlenmez. Sonuç kaynak kod, arayüz, migration ve kurulum doğrulamalarıyla teslim edilir; canlı güvenlik doğrulaması ayrıca açıkça ayrılır.
