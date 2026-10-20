// StatiCrypt v3 相容加解密（AES-CBC + PBKDF2 1k/14k/585k + HMAC）。密碼只從環境變數 HANDBOOK2_PASSWORD 讀取。
// 用法: node crypt.js decrypt <encrypted.html> <out.html>
//       node crypt.js encrypt <plain.html> <template.html> <out.html>
const fs=require('fs'),{subtle}=require('crypto').webcrypto,crypto=require('crypto');
const pw=process.env.HANDBOOK2_PASSWORD; if(!pw){console.error('HANDBOOK2_PASSWORD 未設定');process.exit(2)}
const cfg=JSON.parse(fs.readFileSync(__dirname+'/../.staticrypt.json','utf8'));
const hex=b=>Buffer.from(b).toString('hex'),unhex=h=>Buffer.from(h,'hex'),enc=s=>new TextEncoder().encode(s);
async function pb(p,salt,it,h){const k=await subtle.importKey('raw',enc(p),'PBKDF2',false,['deriveBits']);
 return hex(await subtle.deriveBits({name:'PBKDF2',salt:enc(salt),iterations:it,hash:h},k,256));}
async function hashPw(p,s){return pb(await pb(await pb(p,s,1000,'SHA-1'),s,14000,'SHA-256'),s,585000,'SHA-256');}
async function sign(h,m){const k=await subtle.importKey('raw',unhex(h),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await subtle.sign('HMAC',k,enc(m)));}
const RE=/("staticryptEncryptedMsgUniqueVariableName":")([0-9a-f]+)(")/;
(async()=>{const [cmd,a,b,c]=process.argv.slice(2);const hp=await hashPw(pw,cfg.salt);
 if(cmd==='decrypt'){const html=fs.readFileSync(a,'utf8');const salt=html.match(/"staticryptSaltUniqueVariableName":"([0-9a-f]+)"/)[1];
  if(salt!==cfg.salt)throw'salt 與 .staticrypt.json 不符';const m=html.match(RE)[2];
  if(await sign(hp,m.slice(64))!==m.slice(0,64))throw'HMAC 不符（密碼錯誤？）';
  const k=await subtle.importKey('raw',unhex(hp),'AES-CBC',false,['decrypt']);const e=m.slice(64);
  fs.writeFileSync(b,Buffer.from(await subtle.decrypt({name:'AES-CBC',iv:unhex(e.slice(0,32))},k,unhex(e.slice(32)))));console.log('decrypt OK ->',b);}
 else if(cmd==='encrypt'){const plain=fs.readFileSync(a);let t=fs.readFileSync(b,'utf8');
  const iv=crypto.randomBytes(16);const k=await subtle.importKey('raw',unhex(hp),'AES-CBC',false,['encrypt']);
  const e=hex(iv)+hex(await subtle.encrypt({name:'AES-CBC',iv},k,plain));const msg=(await sign(hp,e))+e;
  if(!RE.test(t))throw'模板找不到加密欄位';t=t.replace(RE,(_,x,y,z)=>x+msg+z);fs.writeFileSync(c,t);console.log('encrypt OK ->',c);}
 else throw'unknown cmd';})().catch(e=>{console.error('ERROR:',e);process.exit(1)});
