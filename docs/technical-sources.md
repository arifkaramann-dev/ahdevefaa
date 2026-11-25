# Teknik kaynaklar ve uygulama kararları

Supabase SSR istemcisi her sunucu isteğinde o isteğin çerezleriyle oluşturulur. Sunucu kimlik doğrulaması `getSession` çıktısına güvenmez; `getUser` veya imza doğrulamalı `getClaims` kullanır. Next.js 16 için `proxy.ts` oturum yenilemesini ve yenilenen çerezlerin istemciye iletilmesini üstlenir. Oturum yanıtları cache edilmez. Kaynak: https://supabase.com/docs/guides/auth/server-side/creating-a-client

RLS yetki kaynağı kullanıcı tarafından değiştirilebilen `user_metadata` olamaz. Rol ve üyelik yardımcıları recursive policy oluşmasını önlemeli; security-definer işlevlerinin search_path'i boş tutulmalı ve adlar schema-qualified olmalıdır. Kaynak: https://supabase.com/docs/guides/database/postgres/row-level-security

Next.js 16 Proxy, path matcher ile statik dosyalardan ayrılabilir; Request/Response cookies API'si oturum yenilemesindeki çerezleri aktarır. Kaynak: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Görsel araştırmada dergâh atmosferi için avlu/taş/ışık kompozisyonları incelendi. Telifli stoklar kullanılmadı; karşılama bölümüne gerçek bir mekânı temsil etmeyen özgün AI avlu görseli üretildi.

Next.js geliştirme sunucusundaki origin kısıtı için yalnız loopback ve mevcut Preview hostname izinli tutulmuştur. `allowedDevOrigins` yalnız geliştirme varlıkları için hostname eşleştirmesi yapar; üretim CORS izni değildir. Kaynak: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
