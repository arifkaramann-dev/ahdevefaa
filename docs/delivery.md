# Tam kapsam kaynak teslimi — Aşama 1–6

Ahde Vefa'nın tam kapsam kaynak sürümü Next.js 16, React 19, TypeScript, Tailwind CSS ve Supabase SSR entegrasyonuyla hazırlanmıştır. Mobil alt navigasyon, masaüstü sol menü ve orman yeşili/kırık beyaz/eskitilmiş altın tasarım dili uygulanmıştır. Dergâh, hoca, sosyal alan, mesaj/bildirim, sohbet/kütüphane, etkinlik ve mektup rotaları kaynakta bulunur.

## Kodlanan işlevler

Hâl kayıtları, 24 saatlik çizelge, namaz ve ibadet takibi, kişisel virdler ve miktar kayıtları, rüya defteri, muhasebe ve özel sorular, birleşik takvim için ekranlar ve gerçek API/veritabanı bağlantı kodu hazırdır. Kişisel kayıtlar tarayıcıda sahte veya geçici kalıcı veri olarak saklanmaz. Bu modüller gerçek giriş, kurulmuş şema ve onaylı derviş/hoca/yönetici rolü olmadan özel kayıt oluşturmaz.

Supabase foundation migration'ına ek olarak tam platform migration'ı öğretmen başvurusu/onayı, anonim gönderi sahipliği, medya sahipliği, bildirim, event RSVP, mektup arşivi ve rol yönetimi RPC'leri için tablo/RLS/grant sınırları ekler. Modül ve kayıt bazlı hoca paylaşımı kullanıcı iznine ve aktif bağlantıya bağlıdır. Yönetici rolü özel günlük ve mesajlara genel okuma yetkisi vermez.

## Doğrulanan sonuçlar

TypeScript kontrolü ve Next.js üretim derlemesi başarılıdır. Önizleme sunucusu platform tarafından 3000 portunda yönetilir. Tam rota manifestindeki bütün sayfalar HTTP 200 ile açılmış; özel mutation başlığı taşımayan sosyal değişiklik isteği HTTP 403 ile reddedilmiştir. Üç migration PostgreSQL parser ile sözdizimi açısından kontrol edilmiştir. PWA manifesti ve statik service worker erişilebilir; service worker özel kayıtlar veya API yanıtlarını cache etmez.

Son migrationdaki 209 SQL ifadesi yerel SQL parser ile sözdizimi açısından kontrol edilmiştir. Fonksiyon revoke/grant imzaları deklarasyonlarla eşleştirilmiştir. Hâl API doğrulaması bütün 11 izinli değeri kabul edip liste dışı değerleri ve sahte sahiplik alanını reddetmiştir. Form sınırları API ile eşleştirilmiş, oturum yenilemesindeki cache başlıkları korunmuştur. Bu kaynak/sözdizimi kontrolleri gerçek Supabase RLS/trigger/grant yürütme testi yerine geçmez.

## Açık kurulum engeli

Güvenli ortamda Supabase URL ve anahtar değerleri bulunmasına rağmen biçim kontrolünde geçerli Supabase proje URL'si ve publishable/anon anahtarı doğrulanamamıştır. Değerler hiçbir mesaja, dosyaya veya loga yazılmamıştır. Bu yüzden uygulama bağlantıyı hazır göstermemekte ve gerçek giriş/kayıt veya özel veri saklamanın başarılı olduğunu iddia etmemektedir.

Migrationlar hiçbir canlı veritabanına uygulanmamıştır. Geçerli Supabase proje URL/anahtarı sonradan bağlanacağı için gerçek Auth, CRUD, RLS, Storage ve Realtime akışları canlıda doğrulanmamıştır. Canlı kullanım için doğru proje bağlantısı, incelenmiş migration, Auth Site URL/e-posta ayarları, private Storage policy'leri ve Realtime publication gerekir. pg_cron varsayılan olarak kapalıdır; E2EE ve harici push/e-posta teslimi yoktur.

## Sonraki aşamalar

Aşama 3 hoca başvuru/onay ve yönetim paneli; Aşama 4 sosyal alan/kardeşlik; Aşama 5 mesajlaşma, bildirimler ve sunucu SSE/Realtimе köprüsü; Aşama 6 sohbetler, kütüphane, etkinlik ve mektuplar için kaynak uçları ve ekranlar eklenmiştir. Canlı migration uygulanmadan şema tablolarının mevcut olması işlevlerin üretimde doğrulandığı anlamına gelmez.

## Kurulum belgeleri

`docs/supabase-setup.md` bağlantı, migration, Auth ve rol ayarlarını; `docs/security.md` gizlilik yaklaşımını ve üretim öncesi sınırları açıklar. `TODO.md` tamamlanan kod ile canlı kuruluma bağlı açık koşulları ayırır. Bu sürüm bağımsız güvenlik denetimi veya hukukî/KVKK uygunluk sertifikası değildir. Yayınlama ayrı bir kullanıcı kontrollü işlemdir; Önizleme canlı yayın değildir.
