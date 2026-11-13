// Exclude only the isolated shop integration when checking frozen educational Worker baselines.
export function educationalWorker(source){
 source=source.replace("import {handleShop,onShopEvent} from './shop.js';\n", "");
 source=source.replace("if(await onShopEvent(event,env,(path,opts)=>supabase(env,path,opts)))return json({received:true});", "");
 source=source.replace("    if(url.pathname.startsWith(\"/v1/shop/\"))return withCors(await handleShop(request,env,(path,opts)=>supabase(env,path,opts),authenticate),c);\n", "");
 source=source.replace("import {handleGifts,onGiftEvent} from './gifts.js';\n", "");
 source=source.replace("if(await onGiftEvent(event,env,(path,opts)=>supabase(env,path,opts)))return json({received:true});", "");
 source=source.replace('    if(url.pathname.startsWith("/v1/gifts/"))return withCors(await handleGifts(request,env,(path,opts)=>supabase(env,path,opts),authenticate),c);\n', '');
 return source;
}
