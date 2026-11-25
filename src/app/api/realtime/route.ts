import {NextRequest} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {verifiedUser} from '@/lib/server/auth';
import {apiError} from '@/lib/server/http';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  const client=await createSupabaseServerClient();
  if(!client)return apiError('Supabase bağlantısı yapılandırılmamış.',503);
  const user=await verifiedUser(client);
  if(!user)return apiError('Oturum açmanız gerekiyor.',401);
  const encoder=new TextEncoder();
  let channel: ReturnType<typeof client.channel>|null=null;
  let keepalive: ReturnType<typeof setInterval>|null=null;
  const stream=new ReadableStream<Uint8Array>({
    start(controller){
      const send=(event:string,data:unknown)=>{try{controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));}catch{ /* client disconnected */ }};
      send('ready',{connected:true});
      channel=client.channel(`ahde-user-${user.id}`)
        .on('postgres_changes',{event:'*',schema:'public',table:'messages'},payload=>send('change',{table:'messages',payload}))
        .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},payload=>send('change',{table:'notifications',payload}))
        .subscribe(status=>{if(status==='SUBSCRIBED')send('status',{connected:true});if(status==='CHANNEL_ERROR')send('error',{message:'Realtime kanalı kurulamadı.'});});
      keepalive=setInterval(()=>send('keepalive',{at:Date.now()}),15000);
      request.signal.addEventListener('abort',()=>{if(keepalive)clearInterval(keepalive);if(channel)void client.removeChannel(channel);try{controller.close()}catch{/* closed */}},{once:true});
    },
    cancel(){if(keepalive)clearInterval(keepalive);if(channel)void client.removeChannel(channel);}
  });
  return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'}});
}
