# PROJE: AHDE VEFA
# Yanlışlıktan değil, yalnızlıktan
## Dijital Dergâh ve Manevî Dayanışma Platformu

Sen kıdemli bir yazılım mimarı, full-stack geliştirici ve UI/UX tasarımcısısın.

Amacın Ahde Vefa isimli, web ve mobil cihazlarda çalışabilen, modern, güvenli ve kapsamlı bir dijital dergâh platformu geliştirmek.

Bu proje sıradan bir sosyal medya uygulaması değildir.

İnsanların manevî hayatlarını takip edebildiği, ibadetlerini ve virdlerini kaydedebildiği, rüyalarını yazabildiği, hocalarıyla iletişim kurabildiği, hikâyeler ve sohbetler paylaşabildiği, birbirlerine destek olabildiği dijital bir topluluk oluşturulacaktır.

Projenin temel yaklaşımı:

"Yanlışlıktan değil, yalnızlıktan. Birbirinin yükünü hafifletmeye çalışan yol arkadaşları."

---

# 1. TEKNOLOJİ MİMARİSİ

Aşağıdaki teknolojileri kullan:

- Frontend: Next.js
- Programlama: TypeScript
- Arayüz: Tailwind CSS
- Veritabanı: PostgreSQL
- Backend: Supabase
- Kimlik doğrulama: Supabase Auth
- Dosya depolama: Supabase Storage
- Gerçek zamanlı mesajlaşma: Supabase Realtime
- Mobil uyumluluk: Responsive PWA

Kod mimarisi modüler, geliştirilebilir ve sürdürülebilir olsun.

Güvenlik ve veritabanı yetkilendirmelerini en baştan tasarla.

Supabase Row Level Security (RLS) politikalarını mutlaka uygula.

---

# 2. KULLANICI ROLLERİ

Dört temel rol oluştur.

## ZİYARETÇİ / ÜYE

- Kayıt olabilir.
- Giriş yapabilir.
- Herkese açık paylaşımları görebilir.
- Profilini düzenleyebilir.
- Hoca bağlantısı için başvuru yapabilir.

## DERVİŞ

Bir hoca tarafından bağlantısı onaylanan kullanıcıdır.

Yetkileri:
- Kişisel manevî oda.
- Günlük hâl takibi.
- Saatlik ruh hâli kaydı.
- Namaz takip sistemi.
- Vird ve zikir takip sistemi.
- Rüya defteri.
- Muhasebe defteri.
- Hoca ile özel mesajlaşma.
- Sesli mesaj gönderme.
- Topluluk paylaşımları.
- Dertleşme alanı.
- Kendisine verilen vazifeleri takip etme.

## HOCA

- Kendisine bağlı dervişleri görüntüler.
- Derviş bağlantı başvurularını değerlendirir.
- Dervişlere özel mesaj gönderir.
- Sesli mesaj gönderir.
- Vazife tanımlar.
- Sohbet ve ders yayınlar.
- Duyuru oluşturur.
- Kendisiyle paylaşılmış kayıtları görüntüler.
- Dervişlerle bireysel iletişim kurar.

Bir hoca yalnızca kendisine bağlı dervişleri yönetebilir.

## YÖNETİCİ

- Kullanıcıları yönetir.
- Hocaları onaylar.
- Kullanıcı rollerini yönetir.
- İçerikleri denetler.
- Şikâyetleri inceler.
- Platform ayarlarını yönetir.
- Sistem istatistiklerini görüntüler.

Yönetici yetkileri, özel günlüklerin ve özel mesajların otomatik olarak okunmasını sağlamamalıdır.

---

# 3. KAYIT VE HOCA BAĞLANTISI

Kayıt sistemi herkese açık olacak.

Kayıt formu:
- Ad soyad
- Kullanıcı adı
- E-posta
- Şifre
- Profil fotoğrafı (isteğe bağlı)
- Kısa tanıtım (isteğe bağlı)

Kayıt olan kişi normal üye statüsünde başlayacak.

Derviş olmak isteyen kişi:
1. Hocalar listesini görür.
2. Bir hocayı seçer.
3. Bağlantı başvurusu gönderir.
4. Hoca başvuruyu inceler.
5. Kabul veya ret kararı verir.
6. Kabul edilirse kullanıcı derviş statüsüne geçer.

Birden fazla hoca desteklenmeli.

İlk sürümde tek hoca kullanılabilmeli.

---

# 4. ANA UYGULAMA MENÜSÜ

Ana menüyü şu şekilde oluştur:

1. Dergâh
2. Sohbetler
3. Yolculuğum
4. Virdlerim
5. Rüyalarım
6. Muhasebem
7. Kardeşlik
8. Hocam
9. Kütüphane
10. Profilim

Mobil cihazlarda alt navigasyon, masaüstünde sol menü kullan.

---

# 5. DERVİŞİN KİŞİSEL ODASI

Her dervişin kendisine özel bir manevî takip paneli oluştur.

## A. Günlük hâl takibi

Kullanıcı günün herhangi bir saatinde kayıt oluşturabilsin.

Hâl seçenekleri:
- Huzurlu
- Mutlu
- Üzgün
- Sıkıntılı
- Öfkeli
- İsteksiz
- Yorgun
- Huzursuz
- Heyecanlı
- Şükür hâlinde
- Diğer

Kullanıcı kendi açıklamasını da yazabilsin.

Her kayıt tarih ve saat bilgisi taşısın.

Günlük, haftalık ve aylık görünüm oluştur.

## B. Saatlik takip

Günün 24 saatini gösteren zaman çizelgesi oluştur.

Kullanıcı gün içerisinde istediği zaman hâl kaydı ekleyebilsin.

Geçmiş kayıtları düzenleyebilsin veya silebilsin.

## C. İbadet takip sistemi

Varsayılan olarak beş vakit namaz takibi oluştur.

- Sabah
- Öğle
- İkindi
- Akşam
- Yatsı

Ek olarak:
- Kur'an okuma
- Dua
- Salavat
- İstiğfar
- Diğer ibadetler

Kullanıcı kendi takip listelerini oluşturabilsin.

Kaza ve nafile ibadetleri ayrı kategorilerde takip edebilsin.

## D. Vird defteri

Kullanıcı kendi virdlerini oluşturabilsin.

Her vird için:
- Vird adı
- Günlük hedef
- Tamamlanan miktar
- Başlangıç tarihi
- Bitiş tarihi (isteğe bağlı)
- Açıklama
- Tekrar sıklığı

Hoca tarafından verilen vazifeler ayrı gösterilsin.

Vird takibi günlük, haftalık ve aylık raporlanabilsin.

## E. Rüya defteri

Rüya kayıt sistemi oluştur.

Alanlar:
- Rüya başlığı
- Rüya anlatımı
- Rüya tarihi
- Uyandığında hissedilen duygu
- Rüya sırasındaki hisler
- Kişisel notlar
- Hocayla paylaş seçeneği

Varsayılan gizlilik: Yalnızca kullanıcı.

Kullanıcı belirli bir rüyayı hocasına açabilsin.

Hoca yalnızca kendisiyle paylaşılan rüyaları görebilsin.

## F. Muhasebe defteri

Günlük kişisel değerlendirme alanı oluştur.

Örnek sorular:
- Bugün nefsime nerede yenildim?
- Kime karşı kırıcı oldum?
- Bugün neye şükrettim?
- Hangi davranışımı düzeltmeliyim?
- Bugün kendimde neyi fark ettim?
- Yarın neyi değiştirmek istiyorum?

Kullanıcı kendi sorularını da oluşturabilsin.

Kayıtlar özel tutulmalı.

## G. Manevî takvim

Bütün günlük kayıtları tek bir takvimde birleştir.

Namazlar, virdler, hâl kayıtları, muhasebe ve rüyalar farklı işaretlerle gösterilsin.

Kullanıcı geçmiş günlerine dönebilsin.

---

# 6. DERGÂH SOSYAL ALANI

Sosyal medya benzeri bir paylaşım akışı oluştur.

Paylaşım türleri:

- Yazılı gönderi
- Fotoğraf
- Hikâye
- Tasavvufî kıssa
- Sohbet duyurusu
- Soru
- Tefekkür
- Ses kaydı

Her gönderide üç gizlilik seçeneği olsun:

1. Herkese açık
2. Sadece hocama özel
3. Sadece kendime özel

İleride belirli gruplara özel paylaşım özelliği eklenebilecek mimariyi kur.

Kullanıcılar:
- Beğeni bırakabilsin.
- Yorum yapabilsin.
- Gönderilere cevap verebilsin.
- İçerikleri kaydedebilsin.
- Şikâyet edebilsin.

Yalnızca herkese açık gönderiler genel akışta görünsün.

---

# 7. HOCAM MODÜLÜ

Derviş ile hoca arasında özel iletişim sistemi oluştur.

Özellikler:
- Yazılı mesaj
- Sesli mesaj
- Mesaj geçmişi
- Okundu bilgisi
- Dosya gönderimi
- Bildirimler

Sesli mesajlar uygulama içerisinde kaydedilip gönderilebilsin.

Hoca panelinde:
- Derviş listesi
- Yeni bağlantı başvuruları
- Dervişlerin kendisiyle paylaştığı kayıtlar
- Özel mesajlar
- Verilen vazifeler
- Görüşme notları

bulunsun.

Hoca kendi yetki alanı dışındaki dervişlerin özel kayıtlarına erişemesin.

---

# 8. KARDEŞLİK MODÜLÜ

Dervişlerin birbirlerine destek olabileceği bir alan oluştur.

Özellikler:
- Dertleşme gönderileri
- Destek mesajları
- Dua talebi
- Yorumlar
- Özel mesajlaşma
- İsteğe bağlı anonim paylaşım

Anonim paylaşımda diğer kullanıcılar paylaşanın kimliğini görmesin.

Topluluk kuralları ve şikâyet sistemi oluştur.

---

# 9. SOHBETLER MODÜLÜ

Hocaların içerik yayınlayabileceği bir alan oluştur.

İçerik türleri:
- Yazılı sohbet
- Sesli sohbet
- Video
- Hikâye
- Menkıbe
- Kıssa
- Duyuru
- Ders

Kategoriler:
- Tasavvuf
- Nefis terbiyesi
- Ahlak
- Edep
- İbadet
- Kur'an
- Hadis
- Günlük hayat

İçeriklere kaynak ve eser bilgisi eklenebilsin.

---

# 10. KÜTÜPHANE

Dijital kütüphane oluştur.

- Kitaplar
- PDF belgeler
- Makaleler
- Ses kayıtları
- Ders notları
- Kaynak metinler

Kategorilere göre filtreleme ve arama bulunmalı.

Telif hakkı ve içerik paylaşım izinleri gözetilmeli.

---

# 11. MEKTUPLAR

Uygulamaya özgü mektup modülü oluştur.

Kullanıcı:
- Kendisine mektup yazabilir.
- Hocaya mektup gönderebilir.
- Bir dervişe mektup gönderebilir.
- İleri tarihli mektup oluşturabilir.
- Mektuplarını arşivleyebilir.

---

# 12. GİZLİLİK VE GÜVENLİK

Bu proje kişisel ve manevî açıdan hassas bilgiler barındıracaktır.

Bu nedenle güvenlik en önemli geliştirme önceliğidir.

Zorunlu kurallar:

- PostgreSQL RLS politikaları.
- Kullanıcı bazlı veri erişimi.
- Hoca ve derviş yetki ayrımı.
- Güvenli dosya depolama.
- Mesajların özel tutulması.
- Kullanıcı verilerinin izinsiz paylaşılmaması.
- Hesap silme ve veri dışa aktarma.
- Oturum güvenliği.
- Rate limiting.
- Şikâyet ve engelleme mekanizması.

Özel günlükler, rüyalar ve muhasebe kayıtları varsayılan olarak yalnızca sahibine açık olmalı.

Kullanıcının hocasına verdiği erişim izni istediği zaman geri alınabilmeli.

İzinler modül ve kayıt bazında yönetilmeli.

---

# 13. TASARIM DİLİ

Ahde Vefa klasik sosyal medya tasarımından ayrılmalı.

Tasarım anlayışı:
- Sade
- Huzurlu
- Ağırbaşlı
- Modern
- Manevî atmosferli
- Gözü yormayan

Renk paleti:
- Koyu orman yeşili
- Kırık beyaz
- Eskitilmiş altın
- Taş grisi

Tasarımda:
- Gereksiz animasyon kullanma.
- Karmaşık dashboard oluşturma.
- Aşırı ikon kullanma.
- Büyük ve okunabilir yazılar tercih et.
- Mobil kullanım öncelikli olsun.

Logo ve marka kimliği için ayrı bir alan bırak.

---

# 14. BİLDİRİM SİSTEMİ

Kullanıcıya şu durumlarda bildirim gönder:

- Yeni mesaj
- Yeni sesli mesaj
- Hoca bağlantı onayı
- Yeni vazife
- Vazife hatırlatması
- Yorum
- Yanıt
- Sohbet duyurusu
- Yeni ders

Bildirim tercihleri kullanıcı tarafından düzenlenebilsin.

---

# 15. VERİTABANI MİMARİSİ

İlişkisel veritabanı oluştur.

En az şu tabloları tasarla:

- profiles
- roles
- teachers
- teacher_applications
- teacher_students
- posts
- comments
- likes
- stories
- messages
- message_attachments
- mood_entries
- prayer_entries
- worship_entries
- wirds
- wird_logs
- dreams
- self_reflections
- assignments
- assignment_logs
- conversations
- conversation_members
- library_items
- lessons
- events
- letters
- notifications
- reports
- privacy_permissions

Gerekli ilişkileri, indeksleri ve foreign key yapılarını oluştur.

Veritabanı migration dosyalarını hazırla.

---

# 16. GELİŞTİRME AŞAMALARI

Projeyi tek seferde kontrolsüz biçimde geliştirme.

Aşağıdaki aşamaları takip et.

### AŞAMA 1 – Temel altyapı
- Proje kurulumu
- Veritabanı
- Kullanıcı kayıt ve giriş
- Rol sistemi
- Yetkilendirme
- Ana tasarım

### AŞAMA 2 – Derviş paneli
- Kişisel oda
- Günlük hâl
- Saatlik takip
- Namaz takibi
- Vird defteri
- Rüya defteri
- Muhasebe defteri

### AŞAMA 3 – Hoca paneli
- Hoca yönetimi
- Derviş bağlantıları
- Başvuru onayı
- Vazife tanımlama
- Özel kayıt görüntüleme izinleri

### AŞAMA 4 – Sosyal alan
- Gönderiler
- Hikâyeler
- Yorumlar
- Beğeniler
- Dertleşme

### AŞAMA 5 – İletişim
- Yazılı mesajlaşma
- Sesli mesaj
- Bildirimler

### AŞAMA 6 – Sohbetler ve kütüphane
- Dersler
- Hikâyeler
- Kütüphane
- Etkinlikler
- Mektuplar
