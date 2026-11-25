# Mesajlaşma ve bildirimler

`/messages`, `/notifications`, tercih ekranı ve kısa bildirim göstergesi kaynakta hazırdır. Mesaj sorgusu yalnız Supabase RLS'nin izin verdiği satırlara dayanır. `/api/realtime` httpOnly oturumu browser'a taşımadan relative SSE başlangıç olayı verir; gerçek postgres_changes köprüsü için Supabase Realtime publication ve canlı bağlantı gerekir.

Ses kaydı ve dosya ekleri için platform medya endpoint'i kullanılmalıdır; canlı MIME, RLS ve Realtime testi yapılmamıştır.
