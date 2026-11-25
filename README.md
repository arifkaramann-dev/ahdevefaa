# Ahde Vefa — Dijital Dergâh

“Yanlışlıktan değil, yalnızlıktan. Birbirinin yükünü hafifletmeye çalışan yol arkadaşları.”

Ahde Vefa, Next.js App Router, TypeScript, Tailwind CSS ve Supabase üzerinde mobil öncelikli manevî takip platformudur. Aşama 1–6 için kaynak kod, modül rotaları, API uçları ve migration dosyaları hazırlanmıştır; bağlantı kurulmadan çalışanmış gibi sahte veri sunulmaz.

## Çalıştırma

Node.js 22 ve `pnpm@11.25.0` ile `pnpm install --frozen-lockfile`, ardından `pnpm dev` kullanılır. Uygulama `0.0.0.0:3000` üzerinde dinler. Üretim için `pnpm build` ve `pnpm start` veya standalone `Dockerfile` kullanılır. `pnpm typecheck` kaynak kodu doğrular.

Manus Önizleme sunucusu `runtime/dev-commands` üzerinden yönetilir. Yayınlama, kaydedilen checkpoint'ten ayrı bir adımdır.

## Supabase kurulumu

Supabase proje URL'si `AHDE_SUPABASE_URL`, publishable veya legacy anon anahtarı `AHDE_SUPABASE_PUBLISHABLE_KEY` ortam değişkenleriyle verilir. Anahtarlar güvenli ortam üzerinden sağlanır; kaynak dosyalara, Git'e veya loglara yazılmaz. Service-role veya secret anahtarı kullanılmaz. Bağlantı bilgileri yalnızca sunucu runtime'ında okunur; derleme sırasında gerekli değildir.

`supabase/migrations/` altındaki migration dosyalarını sırasıyla inceleyip hedef Supabase projesinde uygulamak gerekir. Rutinlerim sayfası için `20261123010000_routines.sql`, ardından `20261124010000_routine_support_program.sql` çalıştırılmalıdır. Hoca rolündeki kullanıcının talebeleri için mahrem tarihli notlar gerekiyorsa son olarak `20261125010000_teacher_student_notes.sql` ve ardından `20261125020000_remaining_platform.sql`, ardından `20261126010000_guidance_core.sql` çalıştırılmalıdır. Bu çalışma migrationları canlı veritabanına otomatik uygulamaz. Auth yönlendirme/e-posta ayarları, rol ve bağlantı tanımlamaları için `docs/supabase-setup.md` okunmalıdır. Bağlantının mevcut olması şemanın kurulmuş olduğu anlamına gelmez.

Yeni kayıt normal üyedir; hoca/yönetici kendi kendine seçilemez. Hoca başvuru/onay paneli ve yönetim API'leri migrationdaki guarded RPC'lere bağlıdır. Kişisel oda erişimi hem sunucu hem RLS tarafından kontrol edilir.

## Kişisel oda

Hâl defteri tarih/saatli kayıtlar, düzenleme/silme, günlük/haftalık/aylık dönemler ve 24 saat çizelgesi içerir. Namaz takibi beş vakti, diğer ibadetler kişisel adları ve günlük/kaza/nafile kategorilerini destekler. Vird defteri tarih/sıklık/hedef ve günlük miktar kayıtlarını raporlar. Rüya defteri kişisel not ve duyguları, muhasebe defteri altı başlangıç sorusu ve kişisel soruları içerir. Birleşik takvim gün bazında kayıt türlerini ayırır.

Tek kayıt veya tüm modül için aktif hocayla paylaşım açıkça seçilir ve geri alınabilir. Modül paylaşımı gelecekteki kayıtları da kapsar. İzin geri alma önceki görüntülemeyi geri getirmez.

## Mahremiyet ve sınırlar

Hassas veriler varsayılan olarak yalnız sahibine açıktır. Yönetici rolüne tüm özel defterleri veya mesajları okuma yetkisi verilmez. RLS ve sunucu sahiplik kontrolleri güvenlik sınırıdır; arayüzde gizleme yetkilendirme değildir. Veri dışa aktarma ve yeniden şifre doğrulamasıyla hesap silme profil sayfasındadır.

PWA service worker yalnız statik offline sayfa ve ikonları cache eder. Özel sayfalar, API yanıtları veya kişisel kayıtlar offline cache/localStorage içinde saklanmaz. Uçtan uca şifreleme sunulmaz. Veritabanı sahibi ve altyapı operatörlerinin teknik erişimi olabilir. Bu ilk teslim üretim güvenlik sertifikası, bağımsız sızma testi veya hukukî/KVKK uygunluk değerlendirmesi değildir. Ayrıntılar `docs/security.md` içindedir.

## Yapı

`src/app` rotaları ve API'leri; `src/components` ortak uygulama çerçevesini; `src/features` kişisel oda, Auth, profil ve bilgi ekranlarını; `src/lib` veri sözleşmesi ve Supabase yardımcılarını içerir. `supabase/migrations` sürümlü veritabanı şemasını, `public` PWA ve marka varlıklarını, `docs` kurulum/güvenlik belgelerini tutar. Rutinlerim; namaz omurgası, günlük enerji/kapasite seçimi, sonraki küçük adım ve şefkatli ritim takibiyle yürütücü işlev destek programı olarak çalışır. Onaylanan kapsam `plan.md`, açık teslim koşulları `TODO.md` dosyasındadır.
