// 用無頭 Chrome 驗證加密後的百寶袋：密碼解鎖、截圖比對、T+5 錄音範例計算（含負數）。
// 用法: node tools/verify.js <candidate.html> <reference.html> <shots_dir>
// 需要: HANDBOOK2_PASSWORD 環境變數；puppeteer-core/pngjs/pixelmatch（預設 /workspace/.hbtools/node_modules）
const M=process.env.HB_NODE_MODULES||'/workspace/.hbtools/node_modules';
const pp=require(M+'/puppeteer-core'),{PNG}=require(M+'/pngjs'),pm=require(M+'/pixelmatch'),fs=require('fs'),path=require('path');
const [cand,ref,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const pw=process.env.HANDBOOK2_PASSWORD;if(!pw){console.error('HANDBOOK2_PASSWORD 未設定');process.exit(2)}
const sleep=t=>new Promise(r=>setTimeout(r,t));let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
async function run(browser,file,tag){const ctx=await browser.createBrowserContext();const pg=await ctx.newPage();
 await pg.setViewport({width:1200,height:900});const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
 await pg.goto('file://'+path.resolve(file));await pg.waitForSelector('input[type=password]');
 await pg.type('input[type=password]',pw);await pg.keyboard.press('Enter');
 await pg.waitForSelector('#tabs',{timeout:30000});await sleep(800);
 const shots={};const shot=async n=>{const f=`${out}/${tag}_${n}.png`;await pg.screenshot({path:f,fullPage:true});shots[n]=f};
 await shot('home');
 const clickText=async(sel,txt)=>pg.evaluate((s,t)=>{const e=[...document.querySelectorAll(s)].find(x=>x.textContent.includes(t));if(e){e.click();return true}return false},sel,txt);
 await clickText('button.tab','營業員');await sleep(500);await shot('sales');
 await pg.evaluate(()=>{const e=[...document.querySelectorAll('button.sec-head')].find(x=>x.textContent.includes('台股')&&x.offsetParent);e&&e.click()});await sleep(500);await shot('sales_tw');
 await pg.type('#q','T+5 錄音範例');await sleep(2000);await shot('search');
 const opened=await pg.evaluate(()=>{const e=[...document.querySelectorAll('#view button,#view a,#view [role=button],#view [tabindex]')].filter(x=>x.textContent.includes('T+5 錄音範例')&&x.offsetParent).sort((a,b)=>a.textContent.length-b.textContent.length)[0];if(!e)return false;e.click();return true});
 await sleep(800);
 const has=await pg.$('#t5r-cyc');ok(opened&&!!has,`[${tag}] 打開 T+5 錄音範例卡片`);
 const r={tag,shots,errs};
 if(has){await shot('t5_off');await pg.click('#t5r-cyc');await sleep(400);await shot('t5_on');
  r.pos=await pg.evaluate(()=>document.getElementById('sheet-body').innerText);
  const set=async(id,v)=>{await pg.$eval('#'+id,(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},v)};
  await set('t5r-cbuy','1,000,000');await set('t5r-csell','1,242,973');await sleep(400);await shot('t5_neg');
  r.neg=await pg.evaluate(()=>document.getElementById('sheet-body').innerText);}
 await ctx.close();return r}
(async()=>{const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--allow-file-access-from-files']});
 const A=await run(b,cand,'new'),B=await run(b,ref,'live');await b.close();
 ok(A.errs.length===0,'新版無 JS 錯誤 '+A.errs.join(';').slice(0,200));
 if(A.pos){ok(A.pos.includes('原買超淨付金額為')&&A.pos.includes('2,042,910')&&A.pos.includes('112')&&A.pos.includes('2,683,022'),'正數：淨付 2,042,910、手續費 112、差額 2,683,022');
  ok(A.neg.includes('原賣超淨收金額為')&&A.neg.includes('242,973')&&!A.neg.includes('-242,973'),'負數：顯示「原賣超淨收金額為 242,973」');
  if(!process.env.ALLOW_VISUAL_DIFF)ok(A.pos===B.pos&&A.neg===B.neg,'計算結果文字與線上版完全相同');}
 for(const n of Object.keys(B.shots)){if(!A.shots[n]){ok(false,'缺截圖 '+n);continue}
  const x=PNG.sync.read(fs.readFileSync(A.shots[n])),y=PNG.sync.read(fs.readFileSync(B.shots[n]));
  if(x.width!==y.width||x.height!==y.height){ok(false,`截圖 ${n} 尺寸不同`);continue}
  const d=new PNG({width:x.width,height:x.height});const diff=pm(x.data,y.data,d.data,x.width,x.height,{threshold:0.1});
  if(diff)fs.writeFileSync(`${out}/diff_${n}.png`,PNG.sync.write(d));if(process.env.ALLOW_VISUAL_DIFF&&diff)console.log(`DIFF 截圖 ${n} 有 ${diff} 像素不同（內容有改，請看 diff_${n}.png 確認是預期的變動）`);else ok(diff===0,`截圖 ${n} 像素差異 ${diff}`)}
 console.log(fail?`驗證失敗 ${fail} 項`:'全部驗證通過');process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(1)});
