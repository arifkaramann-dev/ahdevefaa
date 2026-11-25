# Güvenlik ve gizlilik kararları

## Kimlik doğrulama ve HTTP

Supabase istemcisi yalnız sunucuda ve her isteğin çerez bağlamında oluşturulur. Ortamda yalnız `AHDE_SUPABASE_URL` ile `AHDE_SUPABASE_PUBLISHABLE_KEY` okunur; service-role/secret JWT algılanırsa yapılandırma kapalı kalır. Yetki denetimi `auth.getUser()` ile doğrulanır; `getSession()` tek başına yetki kanıtı değildir. Next.js 16 `src/proxy.ts` Supabase SSR cookie yenilemesini istek ve yanıta taşır. Çerezler varsayılan olarak `HttpOnly; Secure; SameSite=None` olur; iç host adı ve `NODE_ENV` bu davranışı düşürmez. Yalnızca açıkça `AHDE_LOCAL_HTTP=true` verilen loopback yerel HTTP isteğinde `Secure` kapatılır ve `SameSite=Lax` kullanılır; bu ayarı Preview/üretimde kullanmayın.

Signup ve parola değiştirme API'si 8–72 karakter kabul eder (form ile aynı alt sınır). 12+ karakter üretim için öneridir; Supabase Auth native minimumunu 12'ye yükseltmeden önce frontend ve API doğrulamasını birlikte güncelleyin.

Oturum, profil, workspace ve tüm mutation yanıtları `private, no-store` taşır. JSON mutation uçları hem `Content-Type: application/json` hem `X-Ahde-Request: 1` ister; avatar multipart uç noktası da özel başlığı denetler. Yıldızlı/geniş CORS izni tanımlanmaz. Girdiler Zod ile kapalı alan listeleri ve boyut sınırları üzerinden doğrulanır. Per-instance rate limit yalnızca iyi niyetli ek bir sınırdır; çoklu instance veya dağıtık saldırılar için ortak limit deposu değildir.

## Yetki ve kayıt gizliliği

`profiles` ve bağımsız `roles` ayrıdır. Signup trigger'ı normal `member` profili/rolü oluşturur; user metadata rol kaynağı değildir. Rol satırına uygulama kullanıcısının INSERT/UPDATE/DELETE yetkisi yoktur. Hoca onayı ve admin terfisi uygulama API'sinde bulunmaz; yalnız güvenilir Supabase proje sahibi/DB yöneticisi tarafından verilir.

Tüm uygulama tablolarında RLS etkindir. Aşama 1–2 kişisel kayıtları sahip CRUD'u ile sınırlar; upsert/patch/delete sahip filtresi taşır, satır sahibi kimliği güncelleme alanlarından çıkarılmıştır. Vird/vazife günlüklerinin yabancı anahtarları RLS helper'ları ile aynı kullanıcıya ait üst kayda bağlanır. Hoca yalnız onaylı ve etkin bağlantıda, sahibi tarafından açıkça izin verilmiş `dreams`, `mood_entries` veya `self_reflections` satırlarını okuyabilir. İzin geri alınabilir, kayda özgü veya modül geneli olabilir; iznin kendisi yalnız sahibine görünür. Yönetici rolü hiçbir özel günlük, dosya veya mesaj için örtük okuma yetkisi vermez. Gelecek aşama sosyal içerik, mesaj, bildirim, rapor, mektup ve kütüphane tabloları şemada yer alır ancak şu an RLS/DB grant nedeniyle kilitlidir.

RLS içinden çağrılan `private` helper fonksiyonları `SECURITY DEFINER`, `search_path=''` ve schema-qualified isimlerle yazılmıştır; `PUBLIC`/`anon` yürütme izni kaldırılmış, yalnız gerekli `authenticated` erişimleri verilmiştir. Kullanıcı/rol eşlemesi recursive policy üzerinden okunmaz. Hesap silme RPC'si kullanıcı ID almaz: invoker wrapper, çağıranın `auth.uid()` değerini kullanan özel helper'ı çağırır; helper ayrıca verilen parolayı `auth.users.encrypted_password` bcrypt hash'iyle doğrulamadan silmez. API de Supabase parola girişiyle yeniden doğrular. Helper hash yoksa veya pgcrypto doğrulaması yapılamıyorsa hata verir, silme yapmaz. Function yetkisi, pgcrypto schema'sı ve Auth cascade davranışı, migration'ı uygulamadan önce ayrı test projesinde doğrulanmalıdır.

## Veri dışa aktarma, avatar ve silme

`GET /api/export` yalnız doğrulanmış kullanıcının profilini, rolünü, kişisel kayıtlarını, izinlerini, bağlantı/başvuru satırlarını ve kendi günlüklerini JSON indirir; diğer kullanıcıların özel içeriğini veya öğretmen/moderatör verisini dışa aktarmaz. Avatar dosyası yalnız kullanıcı UUID klasörüne yüklenir, izin verilen MIME beyanı gerçek PNG/JPEG/WebP/GIF magic bytes ile eşleşmelidir, boyut en fazla 2 MB'dır; signed URL 60 saniyeliktir. `DELETE /api/account` tam `HESABIMI SİL` onayı ve mevcut parola ile yeniden doğrulama ister. Guarded RPC yoksa işlem 503 ile başarısız olur ve başarı iddiası üretmez. Supabase silme işleminin bütün tablolara cascade etkisini ayrı test projesinde doğrulayın.

## Bilinen sınırlar / üretim öncesi

- Hassas içerik için uçtan uca şifreleme (E2EE) yoktur. Supabase projesinin veritabanı sahibi, yetkili platform/hosting operatörleri ve yedekleri teknik olarak veriye erişebilir; RLS, uygulama yetkilendirme sınırıdır, operatörlerden kriptografik gizlilik sağlamaz.
- Üretim öncesi bağımsız güvenlik incelemesi, gerçek Supabase projesinde test, e-posta/SMTP doğrulaması, Auth rate-limit ve CAPTCHA/abuse önlemleri, yedek/geri yükleme denemesi, silme/cascade doğrulaması, log/olay incelemesi ve gizlilik/retention politikası gerekir. Bu teslim için üretim güvenlik/audit sertifikasyonu yapılmamıştır.
- API limitleri bellek içi ve instance başınadır; dağıtık hız sınırlaması, WAF ve Supabase Auth native limitleri ayrıca yapılandırılmalıdır.
- Auth/DB/Storage migration'ı bu görev kapsamında hiçbir canlı veritabanına uygulanmadı. Storage policy ve silme helper'ı dahil tüm SQL, Dashboard'da manuel uygulamadan önce incelenmeli ve staging'de denenmelidir.
- Sonraki aşama özellikleri için tabloların bulunması, mesajlaşma, başvuru onayı, Realtime, public içerik, moderator işlemi veya dosya eklerinin kullanılabilir olduğu anlamına gelmez.
