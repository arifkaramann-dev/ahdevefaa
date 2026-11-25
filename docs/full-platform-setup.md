# Tam platform kurulumu

Bu teslimde Aşama 3–6 için kaynak kod, API uçları ve migrationlar hazırlandı. Migrationlar canlı Supabase projesine otomatik uygulanmaz.

1. Sırasıyla `20261122000000_initial_schema.sql`, `20261122010000_full_platform.sql`, `20261123010000_routines.sql`, `20261124010000_routine_support_program.sql` ve `20261125010000_teacher_student_notes.sql`, `20261125020000_remaining_platform.sql`, ardından `20261126010000_guidance_core.sql` dosyalarını Supabase SQL Editor'da inceleyip çalıştırın. Son üç migration rutin destek planlarını, hoca-talebe mahrem notlarını ve sosyal/mesaj/mektup güvenlik akışlarını ekler.
2. Supabase Storage'da `avatars-private` ve migration tarafından oluşturulan `platform-media` bucket'larının private olduğundan emin olun. Storage policy'leri ve `media_files` sahiplik kayıtlarını canlı ortamda kontrol edin.
3. Auth URL, redirect ve e-posta ayarlarını gerçek uygulama origin'iyle eşleştirin. `AHDE_SUPABASE_URL` tam HTTPS project URL, `AHDE_SUPABASE_PUBLISHABLE_KEY` publishable veya legacy anon anahtarı olmalıdır; aynı değerler legacy `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` adlarıyla da kullanılabilir; service-role anahtarı kullanılmaz.
4. Realtime publication'a `messages`, `notifications` ve ihtiyaç duyulan güvenli tabloları ekleyin; RLS'yi doğrulamadan yayın açmayın.
5. İleri tarihli mektup ve vazife hatırlatmaları için opsiyonel scheduling migration'ını ancak `private.process_due_items()` idempotent biçimde tamamlandıktan ve pg_cron yetkisi incelendikten sonra etkinleştirin. Mevcut kaynak zamanlayıcı çalışıyor iddiasında bulunmaz.

Temel Supabase bağlantısı ve önceki migrationlar doğrulanmıştır. Rutinlerim modülünün canlı Auth/CRUD/RLS akışı için iki rutin migration’ının ayrıca uygulanması gerekir; destek programı migration’ı uygulanmadan günlük başlatma planı ve namaz omurgası yüklenemez.
