# Hoca ve yönetim modülü

`/teacher` doğrulanmış hoca listesini ve başvuruları `/api/teacher` üzerinden gösterir. Başvuru `apply_teacher` guarded RPC'sine gider. `/admin` özel günlük/mesaj okumaz; yönetim migration RPC'leri uygulandığında rol ve moderasyon işlemleri ek güvenlik sınırlarıyla çalışır.

Canlı Supabase bağlantısı ve migration uygulanmadan işlem başarıyla kaydedilmiş gibi gösterilmez.
