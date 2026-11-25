# Tam platform güvenlik notları

Sunucu uçları `verifiedUser`, strict Zod alanları, `X-Ahde-Request: 1`, private/no-store yanıtlar ve işlem başına sınırlayıcı kullanır. Nihai yetkilendirme Supabase RLS ve guarded RPC'lerdedir; rol istemciden alınmaz.

Anonim gönderilerin kimliği `private.post_owners` içinde tutulur; public API `author_id` açmaz. Yönetici genel moderasyon istatistikleri ve public içerik durumunu yönetebilir, özel günlükleri veya özel mesajları genel olarak okuyamaz. Medya dosyaları kullanıcı UUID yolu, magic-byte kontrolü, 20 MiB sınırı ve 60 saniyelik signed URL ile korunur; mevcut signed URL'ler geri alınamaz.

Bu migrationın canlı veritabanında çalıştırılması ve bağımsız RLS fixture testi bu oturumda yapılmadı. E2EE yoktur; veritabanı sahipleri/altyapı operatörleri için mutlak sıfır erişim garantisi verilmez. Rate limit dağıtık değildir. Uygulama içi bildirimler vardır; harici e-posta/SMS/push teslimi yoktur.
