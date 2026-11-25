# Supabase kurulumu (Aşama 1–2)

Bu uygulama Supabase Auth, PostgreSQL ve private Storage kullanır. Bu belge bağlantı ve yapılandırma adımlarını tarif eder; migration'ı uygulamaz. Önce SQL dosyasını inceleyin, projenizin yedeğini ve hedef Supabase ortamını doğrulayın, sonra yalnızca Supabase Dashboard > SQL Editor üzerinden bilinçli olarak çalıştırın.

## Gerekli sunucu ortamı

Uygulama öncelikle `AHDE_SUPABASE_URL` ve `AHDE_SUPABASE_PUBLISHABLE_KEY` değerlerini okur; eski local kurulumlarla uyum için `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` ve eşdeğer public Supabase adları da desteklenir. İkinci değişken Supabase `sb_publishable_...` anahtarı veya eski `anon` JWT olabilir. `service_role`, `sb_secret_...` veya başka bir ayrıcalıklı anahtar bu alana kesinlikle konmamalıdır; böyle bir anahtar algılanırsa yapılandırma kapalı kalır. Anahtarlar kaynak koda, istemci bundle'ına, loglara veya bu belgeye yazılmamalıdır. Sunucu `.env` dosyalarını Git'e eklemeyin.

`AHDE_SUPABASE_URL` Supabase projesinin `https://<project-ref>.supabase.co` URL'sidir. Çerezler varsayılan olarak `Secure; SameSite=None` olur; iç host adı veya `NODE_ENV` bu tercihi değiştirmez. Yalnızca düz HTTP ile çalışan yerel loopback geliştirmede ayrıca `AHDE_LOCAL_HTTP=true` ayarlanabilir; bu istisnayı Preview/üretim ortamına taşımayın. Değerler uygulama yeniden başlatıldığında runtime'da yüklenmelidir. Bu teslim, browser-side Supabase auth istemcisi veya istemciye açık veritabanı anahtarı kurmaz.

## Migration ve hesap rolleri

Migration: [`supabase/migrations/20261122000000_initial_schema.sql`](../supabase/migrations/20261122000000_initial_schema.sql). Dosya 30 uygulama tablosunu (özel `reflection_questions` tablosu dâhil), indeks/FK'leri, signup profil/normal-üye trigger'ını, RLS politikalarını, private avatar/ek bucket'larını ve isteğe bağlı kendi hesabını silme RPC'sini hazırlar. Silme helper'ı parola hash doğrulaması için pgcrypto gerektirir; hash doğrulanamazsa işlem başarısız olur. SQL'i canlı veritabanına otomatik ya da bu görev kapsamında uygulamayın. Migration sonrasında Table Editor/SQL Editor'da RLS, grants, Auth trigger'ı ve Storage bucket/policy sonuçlarını kontrol edin.

Signup trigger'ı sadece `member` atar; `user_metadata` içindeki rol değerleri okunmaz. Öğretmen ve yönetici terfisi uygulama API'sinde yoktur. Yalnızca yetkili Supabase proje/veritabanı sahibi bunu SQL Editor'da, kimliği ayrıca doğruladıktan sonra yapabilir. Öğretmen için örnek (UUID'yi ve görünen adı güvenilir bir süreçle doğrulayın):

```sql
begin;
insert into public.roles(user_id, role) values ('<verified-profile-uuid>', 'teacher')
on conflict (user_id) do update set role = excluded.role, updated_at = now();
insert into public.teachers(id, display_name, bio, approved)
values ('<same-verified-profile-uuid>', '<approved display name>', '', true)
on conflict (id) do update set display_name = excluded.display_name, approved = true;
commit;
```

Yönetici rolü için yalnızca proje sahibi, doğrulanmış profil satırında `public.roles.role` değerini `admin` yapmalıdır. Derviş yetkisini yalnızca onaylanmış öğretmene ait `teacher_students.active=true` ilişkisinden sonra verin. Bağlantı onayı ve yönetim API'leri bu aşamada sunulmamıştır; öğretmen/admin rolüyle ilgili herhangi bir işlemi genel kullanıcıya açmayın. `admin` rolü hassas kayıtlar veya özel mesajlar için genel okuma izni sağlamaz.

## Supabase Auth ayarları

1. Authentication > URL Configuration altında `Site URL` değerini gerçek uygulama origin'i olarak ayarlayın (ör. `https://app.example`). Yerel geliştirmede gerekiyorsa `http://localhost:3000` değerini ayrı yerel Supabase projesine tanımlayın. Redirect allow-list'e yalnızca gerçekten kullanılan, tam uygulama origin'lerini ekleyin; wildcard kullanmayın.
2. E-posta doğrulaması ve parola kurtarma şablonları `Site URL` altındaki uygulama callback'ine token hash ile gitmelidir. Doğrulama e-postası örneği:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">E-posta adresinizi doğrulayın</a>
```

Parola kurtarma e-postasında da aynı callback'i `type=recovery` ile kullanın:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Şifrenizi yenileyin</a>
```

Callback yalnız `email`, `signup`, `recovery` türlerini kabul eder; doğrulama sonrası host bağımlı olmayan `/profile` yoluna yönlendirir. Parola yenileme isteği özel `redirectTo` göndermez; Supabase yapılandırılmış `Site URL` ve e-posta şablonunu kullanır, `Host` başlığını yönlendirme için kullanmaz.
3. Supabase Auth'ın yerel e-posta gönderim sınırlarını ve üretim için SMTP sağlayıcısını Authentication > Rate Limits / SMTP Settings alanında yapılandırın. Mevcut kayıt/parola API'si ve form en az 8 karakter kabul eder. Üretimde 12+ karakter önerilir; Supabase yerel politikasını 12'ye yükseltmeden önce frontend ve API parola doğrulamasını birlikte 12'ye yükseltin. Uygulama tarafındaki limitler yalnızca süreç başına en iyi çabadır; Auth'ın yerel limitlerinin veya üretim WAF/gateway limitlerinin yerine geçmez.
4. Authentication > Providers altında e-posta/şifre sağlayıcısını ve e-posta doğrulaması politikasını bilinçli seçin. Üretim öncesi doğrulama, parola kurtarma, logout, refresh ve hesap silme akışlarını ayrı bir test Supabase projesinde sınayın.

## Dosya depolama

Migration `avatars-private` (2 MB, PNG/JPEG/WebP/GIF) ve gelecekteki `personal-attachments` (15 MB) bucket'larını private olarak oluşturur veya private duruma zorlar. Storage nesne yollarının ilk bölümü kullanıcı UUID'sidir; RLS owner-first yol denetimi uygular. Aşama 1–2 yalnızca avatar upload ve 60 saniyelik signed URL uçlarını açar. Ek bucket'ı için henüz upload API veya mesaj eki özelliği yoktur; gelecekteki kullanım mevcut değildir, yapılmış gibi gösterilmemelidir.
