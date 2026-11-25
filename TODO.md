# Ahde Vefa — Teslim Durumu

İlk teslim Aşama 1 ve 2'dir. Kullanıcının yeni açık onayıyla Aşama 3–6 da artık bu geliştirme turunun kapsamındadır. Her madde tamamlandı işaretlenmeden önce gerçekleşmiş karşılığı bulunmalıdır.

**Tam kapsam kaynak durumu:** Aşama 1–6 için arayüz, API uçları, private medya akışı ve kurulum belgeleri kaynakta hazırdır; TypeScript ve üretim derlemesi başarılıdır. Supabase bağlantısı ve temel migrationlar çalışır durumdadır. Rutinlerim artık namaz vakitlerini günün omurgası yapan, enerji/kapasite seçimiyle planı küçülten ve davranışın ilk adımını görünür kılan destek programını içerir. `20261123010000_routines.sql` ve `20261124010000_routine_support_program.sql` migration’ları canlı projede ayrıca uygulanmalıdır. Canlı güvenlik ve tüm Auth/CRUD/RLS/Storage/Realtime akışları bağımsız üretim doğrulaması değildir.

## Aşama 1 — Altyapı, erişim ve ana tasarım

- [x] **Uygulama altyapısı:** Next.js, TypeScript ve Tailwind CSS kullanılır. Ürün responsive, mobil öncelikli PWA olarak hazırlanır. Proje mimarisi modüler, geliştirilebilir ve sürdürülebilir olur.
- [ ] **Veri ve servis sağlayıcısı:** PostgreSQL, kullanıcı doğrulama, dosya depolama ve gerçek zamanlı iletişim için Supabase (PostgreSQL, Supabase Auth, Supabase Storage ve Supabase Realtime) kullanılır; başka bir sağlayıcıyla sessizce değiştirilmez. İlişkisel şema, gerekli ilişkiler, indeksler, foreign key'ler ve sürümlü migration dosyaları hazırlanır.
- [x] **İlk veritabanı tabloları:** `profiles`, `roles`, `teachers`, `teacher_applications`, `teacher_students`, `posts`, `comments`, `likes`, `stories`, `messages`, `message_attachments`, `mood_entries`, `prayer_entries`, `worship_entries`, `wirds`, `wird_logs`, `dreams`, `self_reflections`, `assignments`, `assignment_logs`, `conversations`, `conversation_members`, `library_items`, `lessons`, `events`, `letters`, `notifications`, `reports` ve `privacy_permissions` tabloları ya da sonraki teslimlerde uygulamaya alınmak üzere belirtilmiş açık şema kayıtları bulunur.
- [ ] **Kimlik doğrulama:** Herkese açık kayıt ve giriş akışı bulunur. Kayıt alanları: ad soyad, kullanıcı adı, e-posta, şifre, isteğe bağlı profil fotoğrafı ve isteğe bağlı kısa tanıtım. Kayıt olan kişi normal üye olarak başlar. Gerçek Supabase bağlantısı yokken başarılı kayıt/giriş veya kalıcı hassas veri varmış gibi gösterilmez.
- [ ] **Rol/yetki modeli:** Ziyaretçi/üye kayıt olabilir, giriş yapabilir, herkese açık paylaşımları görebilir, profilini düzenleyebilir ve hoca bağlantısı başvurusu yapabilir. Derviş, hoca bağlantısı onaylanan kullanıcıdır. Hoca dervişleri ve başvuruları yönetebilir; bir hoca yalnız kendisine bağlı dervişlere ve yetkilendirilmiş kayıtlara erişebilir. Yönetici kullanıcıları, hocaları, rolleri, içerik denetimini, şikâyetleri, platform ayarlarını ve istatistikleri yönetebilir; yöneticinin rolü özel günlük veya özel mesajları kendiliğinden okunur kılmaz.
- [ ] **Hoca bağlantısı mimarisi:** Kullanıcı hocalar listesini görür, hoca seçerek başvuru gönderir; hoca kabul veya ret kararı verir; kabul üzerine derviş bağlantısı oluşur. Birden fazla hoca desteklenebilir, ilk sürüm tek hocayla kullanılabilir. Hoca rolü/bağlantısı güvenli onay olmadan kazanılamaz.
- [ ] **RLS ve gizlilik:** Supabase Row Level Security (RLS) tabloları ve politikaları uygulanır. Her satır ve dosya için sunucu/veritabanı yetkilendirmesi bulunur. Özel günlükler, rüyalar, muhasebe ve mesajlar varsayılan olarak sahibine açıktır. Hoca yalnız kendisine bağlı dervişlerin kendisiyle paylaştığı kayıtları görebilir. Modül ve kayıt bazlı izinler kullanıcı tarafından geri alınabilir. İstemci arayüzü veya gizlenmiş düğme tek başına yetki kontrolü sayılmaz.
- [ ] **Dosya ve oturum güvenliği:** Supabase Storage özel dosyalar için güvenli erişimle kullanılır; mesajlar ve kullanıcı verileri izinsiz paylaşılmaz. Güvenli oturum ilkeleri uygulanır. Rate limiting, verilerin dışa aktarılması ve hesap silme için güvenli akışlar proje kapsamına alınır.
- [x] **Genel navigasyon:** Ana menü sırasıyla Dergâh, Sohbetler, Yolculuğum, Virdlerim, Rüyalarım, Muhasebem, Kardeşlik, Hocam, Kütüphane, Profilim bölümlerini içerir. Mobilde alt navigasyon, masaüstünde sol menü kullanılır.
- [x] **Tasarım dili:** Arayüz sade, huzurlu, ağırbaşlı, modern, manevî atmosferli ve gözü yormayan olur. Koyu orman yeşili, kırık beyaz, eskitilmiş altın ve taş grisi kullanılır. Gereksiz animasyon, karmaşık dashboard, aşırı ikon ve küçük yazılardan kaçınılır; logo/marka kimliği için ayrı alan bulunur.

## Aşama 2 — Dervişin kişisel odası

- [ ] **Günlük hâl kaydı:** Kullanıcı günün herhangi bir saatinde tarih ve saat bilgili kayıt oluşturur. Hâl seçenekleri Huzurlu, Mutlu, Üzgün, Sıkıntılı, Öfkeli, İsteksiz, Yorgun, Huzursuz, Heyecanlı, Şükür hâlinde ve Diğer'i kapsar. Kullanıcı kendi açıklamasını ekler. Görünüm günlük, haftalık ve aylık dönemlere göre değişebilir.
- [ ] **Saatlik takip:** Günün 24 saatini gösteren zaman çizelgesi bulunur. Kullanıcı gün içerisinde istediği zaman hâl kaydı ekler; geçmiş kayıtları düzenleyebilir ve silebilir.
- [ ] **Namaz ve ibadet:** Varsayılan takip Sabah, Öğle, İkindi, Akşam ve Yatsı namazlarını içerir. Kur'an okuma, dua, salavat, istiğfar ve diğer ibadetler takip edilir. Kullanıcı kendi takip listelerini oluşturur. Kaza ve nafile ibadetler ayrı kategorilerde tutulabilir.
- [ ] **Vird defteri:** Kullanıcı kendi virdlerini oluşturup takip eder. Her vird; ad, günlük hedef, tamamlanan miktar, başlangıç tarihi, isteğe bağlı bitiş tarihi, açıklama ve tekrar sıklığı alanlarını taşır. Hoca tarafından verilen vazifeler kişisel virdlerden ayrı gösterilir. Günlük, haftalık ve aylık raporlama bulunur.
- [ ] **Rüya defteri:** Kayıtta başlık, anlatım, rüya tarihi, uyanınca hissedilen duygu, rüya sırasındaki hisler ve kişisel notlar bulunur. Varsayılan gizlilik yalnızca kullanıcıdır. Kullanıcı rüyayı belirli olarak hocasıyla paylaşabilir; hoca yalnız kendisiyle paylaşılan rüyayı görür. Kullanıcı erişim iznini geri alabilir.
- [ ] **Muhasebe defteri:** Günlük özel değerlendirme alanı şu başlangıç sorularını içerir: “Bugün nefsime nerede yenildim?”, “Kime karşı kırıcı oldum?”, “Bugün neye şükrettim?”, “Hangi davranışımı düzeltmeliyim?”, “Bugün kendimde neyi fark ettim?” ve “Yarın neyi değiştirmek istiyorum?” Kullanıcı kendi sorularını oluşturabilir. Kayıtlar varsayılan olarak özel kalır.
- [ ] **Manevî takvim:** Bütün günlük kayıt türleri tek takvimde birleşir; namazlar, virdler, hâl kayıtları, muhasebe ve rüyalar farklı işaretlerle ayrılır. Kullanıcı geçmiş günlere dönebilir.

## Rutinlerim — günlük işler ve alışkanlık takibi

- [x] **Plan ve kayıt modeli:** Giriş yapmış kullanıcı görev veya alışkanlık oluşturabilir; başlık, açıklama, tür, başlangıç/bitiş tarihi, renk, hedef tekrar ve tek seferlik/günlük/hafta içi/haftalık/aylık tekrar alanları `routines` tablosunda tutulur. Tamamlanmalar tarih bazlı `routine_logs` kayıtlarıyla saklanır; her iki tabloda sahiplik RLS ile korunur.
- [x] **Görev ekleme ve düzenleme:** Kullanıcı yeni plan başlatabilir, haftalık tekrar için günleri seçebilir, mevcut planı düzenleyebilir veya arşivleyebilir. Seçili günün görevleri tek tıkla tamamlandı/tamamlanmadı olarak değiştirilebilir.
- [x] **Haftalık ve aylık takip:** `/routines` sayfası haftalık ve aylık takvim görünümü, dönem ileri/geri gezinme, bugün kısayolu ve seçili gün görev listesini içerir. Gün hücreleri planlanan tekrarları ve tamamlanma oranını gösterir.
- [x] **İlerleme ve seri:** Bugün, hafta ve aktif plan özetleri; son yedi gün ilerlemesi ve ardışık tamamlanan gün serisi görünür. Rutin sayfası mevcut kişisel oda erişiminden bağımsız olarak giriş yapmış normal üyelere açıktır.
- [x] **Namaz omurgalı destek programı:** `/routines` içinde Sabah, Öğle, İkindi, Akşam ve Yatsı ayrı günlük duraklar olarak gösterilir; diğer görev ve alışkanlıklar bir namaz sonrasına bağlanabilir. Gün başlatma ritüeli enerji ve 1–3 küçük adım kapasitesi seçtirir; minimum adım, ideal adım ve sonraki görünür adım alanları davranışı başlatmayı kolaylaştırır. Plan dili rekabetçi seri yerine sakin devam eden ritmi vurgular.
- [x] **1–2–3 rutin geliştirme aşamaları:** Bugün ekranı ve başlatma ritüeli, görev/alışkanlık için başlatma ve daha da küçültme akışı, isteğe bağlı hazır plan şablonları ve haftalık uyarlanabilir değerlendirme aynı `/routines` deneyiminde uygulanmıştır. Haftalık değerlendirme tamamlanma oranını, ritme dönülen günleri ve kapasite seçilen günleri yargılamadan gösterir.
- [x] **Talebe notları ve hatırlatıcıları:** Onaylı hoca, aktif talebeleri için yalnızca kendisine ait mahrem not oluşturabilir; notu sağlık, aile, güzel haber, dert/hassasiyet veya takip edilecek mesele kategorisine ayırabilir, tarih koyabilir, sabitleyebilir, tamamlandı olarak işaretleyebilir ve silebilir. Tarihi gelen notlar hoca panelinde ayrı hatırlatma alanında görünür. Öğrenci tarafı bu özel notları göremez.
- [ ] **Canlı şema kurulumu:** `20261123010000_routines.sql` ve ardından `20261124010000_routine_support_program.sql` migration’ları hedef Supabase projesinde çalıştırılmalıdır; ikisi de uygulanana kadar arayüz canlı destek planı ve rutin kayıtlarını saklamaz.
- [ ] **Canlı hoca notları şeması:** Hoca talebe notları için `20261125010000_teacher_student_notes.sql` migration’ı, önceki temel ve rutin migration’larından sonra hedef Supabase projesinde çalıştırılmalıdır.

## Aşama 3 — Hoca paneli (bu geliştirme turu)

- [ ] **Hoca/derviş yönetimi:** Hoca kendisine bağlı dervişleri görüntüler; bağlantı başvurularını inceler, kabul veya reddeder. Birden fazla hoca desteklenir; ilk sürüm tek hoca ile çalışabilir. Hoca yalnız kendi yetki alanındaki dervişlere erişebilir.
- [x] **Hoca araçları:** Hoca aktif talebeyi seçebilir, vazife tanımlayabilir, ilerlemeyi görebilir ve görüşme notu ile sonraki adımı kaydedebilir; özel iletişim sınırları korunur.
- [ ] **Hoca paneli alanları:** Derviş listesi, yeni bağlantı başvuruları, dervişlerin kendisiyle paylaştığı kayıtlar, özel mesajlar, verilen vazifeler ve görüşme notları yer alır.
- [ ] **Hassas kayıt yetkisi:** Hoca kendisine bağlı olmayan dervişlerin özel kayıtlarına erişemez; bağlı olduğu kullanıcıların bile yalnızca kendileriyle açıkça paylaştığı kayıtları görebilir. Paylaşım izinleri modül ve kayıt bazında geri alınabilir.
- [ ] **Yönetici denetimi:** Yönetici hocaları onaylar, kullanıcıları ve kullanıcı rollerini yönetir, içerikleri denetler, şikâyetleri inceler, platform ayarlarını yönetir ve sistem istatistiklerini görüntüler. Yönetici yetkileri özel günlüklerin ve özel mesajların otomatik okunmasını sağlamaz.

## Aşama 4 — Dergâh sosyal alanı ve kardeşlik (bu geliştirme turu)

- [ ] **Gönderi türleri:** Yazılı gönderi, fotoğraf, hikâye, tasavvufî kıssa, sohbet duyurusu, soru, tefekkür ve ses kaydı desteklenir.
- [ ] **Gönderi gizliliği:** Her gönderi herkese açık, yalnız hocama özel veya yalnız kendime özel seçeneklerinden biriyle saklanır. Genel akışta yalnız herkese açık gönderiler görünür. İleride belirli gruplara özel paylaşım eklenmesine elverişli mimari bulunur.
- [x] **Gönderi etkileşimleri:** Kullanıcılar beğeni bırakabilir, yorum yazabilir, gönderilere cevap verebilir, içerikleri kaydedebilir ve şikâyet edebilir; API ve RLS ile sahiplik korunur.
- [ ] **Kardeşlik alanı:** Dertleşme gönderileri, destek mesajları, dua talebi, yorumlar, özel mesajlaşma ve isteğe bağlı anonim paylaşım bulunur. Anonim paylaşımda diğer kullanıcılar paylaşanı tanımlayan kimliği görmez.
- [x] **Topluluk güvenliği:** Topluluk kuralları, şikâyet ve kullanıcı engelleme mekanizması bulunur; rapor ve engel tabloları kullanıcı sınırında tutulur.

## Aşama 5 — Mesajlaşma ve bildirimler (bu geliştirme turu)

- [ ] **Hoca/derviş iletişimi:** Özel yazılı mesaj, uygulama içinde kaydedilip gönderilebilen sesli mesaj, mesaj geçmişi, okundu bilgisi, dosya gönderimi ve bildirimler bulunur. Hoca paneli ve derviş arayüzü aynı konuşmanın yetkilendirilmiş geçmişini paylaşır.
- [x] **Yetkilendirme:** Bir hoca yalnız bağlı olduğu dervişlerle bireysel iletişim kurabilir. Konuşmaların erişimi konuşma üyeleriyle sınırlıdır; güvenli RPC ve RLS kullanılır. Yönetici özel mesajları otomatik okuyamaz.
- [ ] **Bildirim türleri:** Yeni mesaj, yeni sesli mesaj, hoca bağlantı onayı, yeni vazife, vazife hatırlatması, yorum, yanıt, sohbet duyurusu ve yeni ders için bildirim gönderilir.
- [ ] **Bildirim tercihleri:** Kullanıcı bildirim tercihlerini düzenleyebilir.

## Aşama 6 — Sohbetler, kütüphane, etkinlik ve mektuplar (bu geliştirme turu)

- [ ] **Sohbet ve ders yayınları:** Hocalar yazılı sohbet, sesli sohbet, video, hikâye, menkıbe, kıssa, duyuru ve ders yayınlayabilir. Kategoriler Tasavvuf, Nefis terbiyesi, Ahlak, Edep, İbadet, Kur'an, Hadis ve Günlük hayatı içerir. İçeriğe kaynak ve eser bilgisi eklenebilir.
- [ ] **Dijital kütüphane:** Kitaplar, PDF belgeler, makaleler, ses kayıtları, ders notları ve kaynak metinler sunulur. Kategori filtresi ve arama bulunur. Telif hakları ve içerik paylaşım izinleri gözetilir.
- [x] **Mektuplar:** Kullanıcı kendisine mektup yazabilir, hocaya veya bir dervişe mektup gönderebilir, ileri tarihli mektup oluşturabilir ve mektupları arşivleyebilir; gönderici RLS ile korunur.
- [ ] **Etkinlikler:** Etkinlik verileri ilişkisel modelde tutulur ve uygun yayın/kütüphane akışıyla bağlanır.

## Tüm aşamalarda geçerli gizlilik, güvenlik ve ürün ilkeleri

- [ ] **Özel veri varsayılanı:** Özel günlükler, rüyalar ve muhasebe kayıtları yalnızca sahibine açıktır. Kullanıcının izni olmadan kullanıcı verisi paylaşılmaz. Kullanıcı hocasına verdiği erişim iznini istediği zaman geri alabilir; izin modül ve kayıt bazında yönetilir.
- [ ] **Sunucu/veritabanı güvenliği:** PostgreSQL RLS, kullanıcı bazlı veri erişimi, hoca/derviş yetki ayrımı, güvenli dosya depolama, özel mesajların korunması, oturum güvenliği ve rate limiting uygulanır. Arayüzdeki gizleme tek başına güvenlik olarak değerlendirilmez.
- [ ] **Kullanıcı hakları:** Hesap silme ve veri dışa aktarma akışları desteklenir.
- [ ] **Moderasyon:** Şikâyet ve engelleme mekanizması bulunur.
- [ ] **Ürün yaklaşımı:** Proje sıradan bir sosyal medya uygulaması değildir. “Yanlışlıktan değil, yalnızlıktan. Birbirinin yükünü hafifletmeye çalışan yol arkadaşları.” ilkesi ürün diline ve işlevlerine yansır; suçlayıcı veya rekabetçi ibadet karşılaştırmaları kullanılmaz.
