# Tam kapsam geliştirme sözleşmesi

Bu dosya paralel parçaların ortak sözleşmesidir. Şartname `docs/specification.md`, önceki kapsam `TODO.md` ve mevcut kaynak kodla birlikte okunur. Aşama 3–6 artık bu teslimde kodlanır. Supabase URL/anahtarları geçersiz olduğundan canlı test engeli korunur. Migrationları canlı veritabanına uygulamayın, kullanıcı hesabı üretmeyin ve sahte veri/oturum eklemeyin. Mevcut birinci migration korunur; yeni şema `20261122010000_full_platform.sql` içindedir. Zamanlama ayrı isteğe bağlı migration ile kurulur.

## Ortak frontend/sunucu

`useWorkspace` (`@/components/providers`) mevcut gerçek session'ı, kişisel oda verisini, `refresh`, `notify` ve kişisel CRUD'u sağlar. Yeni modüller kendi API verilerini fetch eder; ortak `apiRequest(url,method,data)` JSON mutation için `X-Ahde-Request:1` gönderir ve non-2xx hatalarını fırlatır. Dosya upload multipart aynı özel başlığı taşır. Tüm işlevler gerçek Auth ve Supabase RLS'ye bağlıdır; bağlantı yokken anlaşılır boş/hata durumu gösterilir, başarılı saklama iddiası üretilmez. Formların sınırları API/DB ile eşleşir. Arayüz Türkçe; mevcut `.card`, `.button`, `.button.secondary`, `.field`, `.input`, `.eyebrow`, `.section-title` stilleri kullanılır; ek CSS her feature klasöründe scope'lu olur.

`createSupabaseServerClient`, `verifiedUser`, `databaseRole`, `readJsonMutation`, `json`, `apiError`, `rateLimit` mevcut sunucu yardımcılarıdır. RLS her işlemde nihai sınırdır. Rol/asıl sahiplik istemciden alınmaz. Hoca/yönetici erişimi sunucuda da doğrulanır. JSON mutation sınırlı boyut ve kapalı Zod alan listesi taşır. Hiçbir service-role anahtarı kullanılmaz. API'ler private/no-store'dur. Türler her feature'in kendi `types.ts` dosyasında tanımlanabilir; ana `src/lib/types.ts` dosyasını paralel parçalar değiştirmez.

## Şema ve ortak yardımcılar

Yeni migration mevcut tablolara aşağıdaki alanları ekler ve eski kilitli modüllerin RLS/grant'lerini bilinçli açar. Private RLS helpers security-definer, boş search_path ve schema-qualified adlar kullanır. Public iş RPC'leri sadece tanımlanan işlemi doğrulanmış `auth.uid()` ile yapar; parametre ile actor taklit edilemez. Her public RPC'den PUBLIC execute kaldırılır; gerektiği kadar anon/authenticated verilir.

`public.public_profiles(_ids uuid[])` sadece `id,full_name,username,bio` döndürür; en fazla100 ID. Bunlar toplulukta görünen profil alanlarıdır; e-posta, rol, tercihler ve özel defterler dahil değildir. Öğretmen, sosyal, iletişim ve içerik API'leri gösterim için bunu kullanabilir.

`public.search_members(_query text)` yalnız doğrulanmış kullanıcıya en fazla20 minimal profil (`id,full_name,username,bio`) döndürür; bloklanan ilişkiler dışarıda kalır. Kullanıcı adı/ad aramasına en az2 karakter gerekir. Konuşma/mektup alıcısı rol ve bağlantı kontrolü ayrıca işlemin RPC'sinde yapılır.

`profiles.suspended boolean default false`; platformdan askıya alınan hesapla yeni modül mutation'ları ve mevcut özel veri yazımları RLS tarafından reddedilir. Admin rolü özel günlük, mektup veya mesaj için genel SELECT sağlamaz. Kullanıcının kendi profil/oturum durumunu okuyabilmesi korunur. İlk admin yalnız DB sahibi tarafından atanır.

`media_files`: id UUID, owner_id profile FK, path UNIQUE TEXT, mime_type TEXT, size_bytes INT, created_at. Bucket `platform-media` private, dosya en fazla20MiB, izinli JPEG/PNG/WebP/GIF/PDF/MP3/OGG/WebM/WAV/MP4; SVG/HTML/JS yok. Dosya yolu ilk segment kullanıcı UUID'sidir. Metadata owner ve path DB'de de doğrulanır. `private.can_read_media(path)` yalnız sahibi veya yolu izinli post/message/library/lesson içinde görünür olan kullanıcıyı kabul eder. Kısa signed URL önceki indirilenleri geri alamaz.

## Hoca ve yönetici

Yeni tablo `teacher_requests`: id,user_id UNIQUE FK,bio,status(pending/approved/rejected),created_at,decided_at. `teacher_notes`: id,teacher_id,student_id,title,body,created_at,updated_at; hoca yalnız aktif öğrencileri için kendi notunu okur/yazar. `platform_settings`: key,value JSONB,updated_at; yalnız admin yönetir. `audit_logs`: id,actor_id,action,target_id nullable,details JSONB,created_at; yalnız güvenli yönetim metadata'sı, özel içerik yok.

RPC'ler:
- `apply_teacher(_teacher_id uuid,_message text)` → teacher_applications satırı; auth üye, onaylı hoca, aktif başka hoca/pending çatışması denetlenir.
- `decide_teacher_application(_application_id uuid,_approve boolean)` → JSON; yalnız başvurunun onaylı hocası. Transaction lock, tek aktif bağlantı, onayda teacher_students ve member→dervish rolü atomik. Ret yalnız ilgili başvuruda.
- `apply_as_teacher(_bio text)` → teacher_requests satırı; kendi başvurusu.
- `approve_teacher(_request_id uuid,_approve boolean)` → JSON; yalnız admin; onayda teachers.approved ve teacher rolü atomik.
- `admin_set_role(_user_id uuid,_role text)` → JSON; yalnız admin; hoca rolü için onaylı teachers, dervish için aktif link, son aktif adminin düşürülmesini engelle.
- `admin_set_suspension(_user_id uuid,_suspended boolean)` → JSON; yalnız admin; son aktif admin/öz-self kilitlenmesi engellenir.
- `admin_statistics()` → güvenli platform toplamları (users,teachers,posts,reports,lessons,library_items); özel defter veya mesaj içerikleri/kişiye bağlı sayılar yok.
- `admin_users(_query text)` → yalnız admin için id,full_name,username,email,role,suspended,created_at; bounded100. Özel günlük alanları yok.

`/api/teacher`: GET kendi teachers,applications,students,shared_records,assignments,notes,teacher_requests verisini role göre döndürür. Member için onaylı directory ve kendi başvuruları; hoca için yalnız kendi öğrencileri ve RLS ile paylaşılan mood/dream/reflection kayıtları. POST discriminated action: apply,decide,requestTeacher,createAssignment,createNote. PATCH assignment/note kendi hocasına, DELETE yalnız kendi not/vazifesi; öğrenci aktif ilişki doğrulanır.

`/api/admin`: GET güvenli users/teacher_requests/reports/statistics/settings/audit. POST action approveTeacher,setRole,setSuspension,resolveReport,moderatePost,moderateLesson,setSetting. Moderasyon yalnız genel/public içeriklerde; admin özel günlük/mesaj/mevcut mektup okuyamaz. Moderasyonda anonim post sahibinin kimliği döndürülmez. Ayarlar dar allowlist olur. Her yönetim değişikliği audit kaydı oluşturur.

Frontend `/teacher` → `TeacherPage` (`src/features/teacher/index.tsx`), `/admin` → `AdminPage` aynı feature'den export. Başvuru ve hoca yönetimi gerçek işlemlerle çalışır; bağlı dervişe mesaj için `/messages?peer=UUID` bağlantısı.

## Dergâh ve kardeşlik

posts ek alanları: title default'', type(text/photo/story/qissa/announcement/question/reflection/audio/prayer/support), area(dergah/community), anonymous BOOL, teacher_id nullable FK, group_id nullable geleceğe hazır. Mevcut author_id anonymous postta NULL olabilmelidir. Sahiplik `private.post_owners(post_id PRIMARY KEY,user_id)` içinde tutulur; diğer kullanıcıya, hatta normal admin ekranına anonim yazar kimliği açılmaz. Nonanonymous post author_id auth.uid olur; anonymous post author_id NULL olur. API/DB owner kontrolü private mapping kullanır.

RLS post görünürlüğü: owner; veya public+published; veya teacher görünürlüğü ve explicit teacher_id ile aktif link. Community oluşturma derviş/hoca/admin; Dergâh genel gönderi oluşturma authenticated member de olabilir. Block ilişkileri genel akış/yorum/konuşmada gözetilir. Silinen/removed post genel akışta görünmez. Private veya teacher gönderi genel akışa girmez.

`post_saves`: id,user_id,post_id UNIQUE(user_id,post_id); self-only. `user_blocks`: blocker_id,blocked_id composite PK,created_at; self-only; kendini bloklama yok. `private.users_blocked(a,b)` simetrik erişim helper. Yorumlar post görünürlüğüne bağlıdır; parent_id aynı posttan olmak zorundadır. Like/save owner self-write ve okunabilir post bağı zorunludur. Report target tipleri post/comment/lesson/user; hedef kaydı kullanıcı gerçekten görebilmeli (user minimal directory); özel mesaj veya günlük içerikleri report ile genel admin okumasına açılmaz.

RPC'ler: `create_post(_data jsonb)` → posts row, alanları yukarıdaki schema'ya göre strict doğrular ve private ownership map'i transactionda oluşturur. `_data`: title,body,type,area,visibility,anonymous,teacher_id nullable,media_paths string[], status defaultpublished. Media metadata gerçek owner olmalı. `owned_post_ids()` → auth.uid'nin UUID seti. `post_statistics(_ids uuid[])` → her görünürpost için id,like_count,comment_count,liked,saved; özel kullanıcı listesi yok. `moderate_post(_post_id uuid,_status text)` → yalnız admin public postun published/removed statüsü. `create_report(_target_type text,_target_id uuid,_reason text)` → reports row güvenli görünürlük kontrolüyle. RLS/helper isimleri security agent tarafından belirlenebilir, public RPC isimleri sabittir.

`/api/social`: GET ?area=dergah|community&scope=feed|mine|saved → {posts,comments,stats,own_ids,profiles,blocks}. Pagination bounded50/100, arama ve post tür filtresi; anonymous author NULL ve profil eşleştirmesi yok. POST action createPost,comment,like,save,report,block. DELETE action post/comment/like/save/block + uygun id/post_id; sahibi dışında post/yorum değişmez. PATCH post/yorum owner edit; post alan/teacher/visibility güvenliği RLS ile de denetlenir. `/api/files` upload/download kullanılır.

Frontend `SocialPage({area:'dergah'|'community'})` (`src/features/social/index.tsx`); `/` mevcut karşılama tasarımını koruyup akışın girişini gösterir, `/dergah` tam akış, `/community` kardeşlik. Yeni yazı/foto/ses/hikâye, gizlilik, anonim yalnız kardeşlik, yorum/yanıt, beğeni, kaydet, rapor ve engelle gerçek işlemler. Bütün boş/hata durumları dürüst.

## İletişim ve bildirimler

conversations ek kind='direct', title default'', unique direct_pair_key; conversation_members.last_read_at nullable. messages ek kind(text/audio/file),client_nonce UUID nullable UNIQUE(sender_id,client_nonce),updated_at. Ekler existing message_attachments'ta metadata. Konuşma/üyelik yalnız guarded RPC ile yaratılır. RLS sadece iki konuşma üyesine; yöneticiye genel mesaj erişimi yok.

RPC: `open_direct_conversation(_recipient_id uuid)` → conversations row. Derviş–derviş ve aktif hoca–derviş çiftleri; hoca yalnız aktif bağlı öğrencisiyle yeni konuşma açar. Blok ve suspension kontrolü. Idempotent deterministic pair + transaction lock. `send_message(_conversation_id uuid,_body text,_kind text,_paths text[],_client_nonce uuid)` → message row; üye, blok, içerik/mime/owner/path kontrolü ve attachments transaction içinde. Boş body+boş paths reddedilir. `mark_conversation_read(_conversation_id uuid)` → JSON; yalnız kendi üyeliğinin last_read_at. `messages` ve `notifications` Supabase Realtime publication'a güvenli eklenir.

`/api/messages`: GET ?conversation=UUID → {conversations,messages,attachments,members,profiles}; kendi konuşmaları ve seçili son100 mesaj. POST actions open,send,read. Konuşma listesinde unread sonokuma bilgisi; read receipt iki kişi için gösterilir. `/api/realtime`: GET conversation optional → SSE event `change` ve keepalive; Supabase Realtime postgres_changes ile kullanıcının yetkili mesaj/bildirim değişikliklerine bağlanır. Doğrulanmış user ardından getSession yalnız Realtime token taşımak için kullanılabilir; token/anahtar browser'a veya loga döndürülmez. Abort/reconnect cleanup ve per-user RLS filtreleri şarttır. EventSource aynı origin relative URL'de, değişimde veriyi yeniden fetch eder. Realtime kurulmamışsa arayüz bağlantı durumunu açık gösterir; polling'i gerçek zamanlı diye pazarlamaz.

`/api/notifications`: GET kendi bildirimlerini bounded100; PATCH ids/readAll → yalnız kendisine read_at günceller. notifications ek link TEXT default'/',event_key TEXT nullable UNIQUE(user_id,event_key). DB trigger/helper: new message/audio, teacher connection approval, assignment, assignment reminder, comment/reply, lesson/announcement; yalnız ilgili user ve notification_preferences defaultenabled ile. İçerik özel not metnini notification body'ye kopyalamaz. Preferences keyleri message,audio_message,teacher_approval,assignment,assignment_reminder,comment,reply,announcement,lesson.

Frontend `/messages` → `MessagesPage`, `/notifications` → `NotificationsPage`, `NotificationsButton` (`src/features/messaging/index.tsx`). Ses kaydı MediaRecorder ile uygulama içinde, browser izin/HTTPS/yetenek hataları, cancel ve boyut/süre sınırı; Blob upload `/api/files`, gerçek gönderim. Dosya/text, geçmiş ve okundu göstergesi. `?peer=UUID` ile öğretmen/üye mesaj linkleri. NotificationsButton topbar parent tarafından bağlanır. Tercih UI aynı feature'de export `NotificationPreferences` (parent Profilim'e bağlayacak), PATCH /api/profile mevcut alanını kullanır.

## Sohbet, kütüphane, etkinlik ve mektuplar

lessons ek kind(text/audio/video/story/menkibe/qissa/announcement/lesson), work_title default'', license default'', permission_confirmed bool; mevcut title,body,media_path,category,source,is_published,teacher_id. Kategoriler Tasavvuf,Nefis terbiyesi,Ahlak,Edep,İbadet,Kur'an,Hadis,Günlük hayat. Hoca/admin yayınlar; hoca own, admin public moderasyon; taslaklar own, yayınlananlar public.

library_items ek owner_id profile FK,kind(book/pdf/article/audio/note/source),license TEXT,permission_confirmed BOOL,external_url nullable. Mevcut teacher_id,title,description,category,source,storage_path,is_published. Dosya yayınında permission_confirmed zorunlu. Sahip hoca/admin CRUD; public sadece published. events ek aynı existing title/description/start/end/location/host_teacher_id/public; RSVP için event_registrations(event_id,user_id composite PK,created_at), userown.

letters ek status(draft/sent),delivered_at nullable. Owner sender,recipient kendisi/hocası/derviş olabilir. Draft sadece sender; sentfuture sadece sender; recipient yalnız sent ve deliver_at<=now, uçta değil RLS'de korunur. Sender daima kendi mektubunu görür. İlişki/recipient ve timestamp sınırları create'de doğrulanır; sentletter body immutable, draft edit/delete owner. `letter_archives(letter_id,user_id composite PK,archived_at)` her kişinin arşivi ayrı. Mektup diğer kullanıcıya açılmaz; admin genel erişim almaz.

`/api/content`: GET ?kind=lessons|library|events&scope=published|mine,search/category/type filtreleri → {items,profiles}; public read veya own drafts. POST/PATCH/DELETE strict resource +data+id; teacher/admin CRUD denetlenir. event RSVP action gerçek kayıt. Dosya `/api/files` ile upload/sign. Kindleri frontend kendi types içinde tanımlar.

`/api/letters`: GET ?scope=inbox|sent|drafts|archive → {letters,profiles,archives}. POST create/send/archive; PATCH draft edit; DELETE own draft veya archive entry. Gönder/alıcı/tarih ilişkileri DB RLS ile de korunur. Uygulama açılınca due processing RPC çağrılır, cron yoksa sadece gecikmeli bildirim fallback diye belirtilir.

RPC `process_my_due_items()` sadece auth.uid ile kendi vadesi gelen mektup/hatırlatma bildirimlerini idempotent işler. Private global `process_due_items()` pg_cron'a aittir. Opsiyonel `20261122020000_scheduling.sql` Supabase pg_cron ile dakikalık ileritarihli teslim ve görev hatırlatma kurar; önce ilgili resmî doküman doğrulanır. Timer kurulmadan sürekli çalışma iddiası yoktur.

Frontend `ContentPage({section:'lessons'|'library'|'events'})`, `LettersPage` (`src/features/content/index.tsx`): yayın formu, kaynak/eser/izin, ses/video oyuncusu, PDF/dosya indirme, arama/kategori filtresi, takvim/listelenen etkinlik RSVP, kendi/hoca/derviş alıcı mektup formu, future datetime ve ayrı arşiv. `/conversations`,`/library`,`/events`,`/letters` parent rotalar.

## Dosya sahipliği ve teslim

1. Güvenlik/veritabanı parçası yalnız yeni supabase migrationları, `/api/files`, `/lib/server/platform-*`, `docs/full-platform-setup.md`, `docs/full-platform-security.md` dosyalarını yazar. Diğer parçaların API/feature dosyalarını değiştirmez.
2. Hoca parçası yalnız `src/features/teacher/**`, `/api/teacher`, `/api/admin`, `docs/module-teacher.md`.
3. Sosyal parça yalnız `src/features/social/**`, `/api/social`, `docs/module-social.md`.
4. İletişim parçası yalnız `src/features/messaging/**`, `/api/messages`, `/api/realtime`, `/api/notifications`, `docs/module-messaging.md`.
5. İçerik parçası yalnız `src/features/content/**`, `/api/content`, `/api/letters`, `docs/module-content.md`.

Parent ortak rotalar, navigasyon, provider entegrasyonu, ana sayfa ve profil ayarlarını bağlar; TODO/README/teslim ve Git'i yönetir. Alt parçalar Git kullanmaz; browser açmaz; source secrets görmez/yazmaz. Şema ve RPC ortak adlarına uyulur. Her parça yapamadığı gereksinimi somut açık koşul olarak belirtir, başarıyı uydurmaz. Bir son salt okunur entegrasyon incelemesi gerçekleşir. Kod, API/DB rol sınırları ve yerel SQL testleri ile canlı Supabase testleri birbirine karıştırılmaz.
