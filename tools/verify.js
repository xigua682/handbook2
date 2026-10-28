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
 if(has){const set=async(id,v)=>{await pg.evaluate((id,v)=>{const e=document.getElementById(id);if(!e)return;e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))},id,v)};const txt=()=>pg.evaluate(()=>{const e=document.getElementById('t5r-text');return e?e.innerText:document.getElementById('sheet-body').innerText});
  await set('t5r-dT','1027');await set('t5r-buy','15,095,987');await set('t5r-short','14,990,667');await set('t5r-stock','2454');await set('t5r-lots','4');await set('t5r-loan','15,080,000');await set('t5r-side','sell');await set('t5r-net','33,674,289');await sleep(300);await shot('t5_off');r.off=await txt();
  await pg.click('#t5r-cyc');await sleep(400);await shot('t5_on');r.jerry=await txt();
  await set('t5r-loan','640,000');await set('t5r-side','buy');await set('t5r-net','2,042,910');await sleep(400);await shot('t5_buy');r.pos=await txt();
  await set('t5r-side','sell');await set('t5r-net','242,973');await sleep(400);await shot('t5_neg');r.neg=await txt();
  await set('t5r-net','1,000,000');await sleep(400);r.sellpos=await txt();
  if(await pg.$('#t5r-cadv')){await set('t5r-cadv','500,000');await sleep(300);r.ovr=await pg.$eval('#t5r-cfee',e=>e.value);
   await set('t5r-cadv','');await sleep(300);r.clr=await pg.$eval('#t5r-cadv',e=>e.value);}}
 await ctx.close();return r}
(async()=>{const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--allow-file-access-from-files']});
 const A=await run(b,cand,'new'),B=await run(b,ref,'live');await b.close();
 ok(A.errs.length===0,'新版無 JS 錯誤 '+A.errs.join(';').slice(0,200));
 if(A.jerry){const J="客戶姓名：\n\n帳號：\n\n您好，您於 10/27 交易之買超交割金額為 15,095,987 元，應於 10/29 入帳，惟尚缺14,990,667元，請問您要以 10/28 賣出 2454 股票 4 張之在途款項作為抵押擔保品，借款15,080,000 元？\n\n另您於10/28日交易之賣超淨收金額為33,674,289元，本公司將扣除10月29日之代墊款15,080,000元，及手續費(萬分之1.75)2,639元後，剩餘款項18,591,650元將於10月30日匯入您的交割帳戶。";const nz=x=>x.replace(/\n+/g,'\n').trim();if(nz(A.jerry)!==nz(J))console.log('JERRY GOT:\n'+A.jerry);ok(nz(A.jerry)===nz(J),'循環賣超：與 Jerry 範例逐字相同（剩餘 18,591,650）');
  ok(A.pos.includes('買超淨付金額為2,042,910元')&&A.pos.includes('借款2,682,000')&&A.pos.includes('跟您收取差額款項2,683,022元'),'買超：淨付 2,042,910、差額 2,683,022、可借 2,682,000');
  ok(A.neg.includes('跟您收取差額款項397,139元')&&A.neg.includes('賣超淨收金額為242,973元')&&!A.neg.includes('剩餘款項'),'賣超不足：維持收取差額 397,139');
  ok(A.sellpos.includes('剩餘款項359,888元將於')&&!A.sellpos.includes('跟您收取'),'賣超有剩餘：剩餘款項 359,888 元 T+3 匯入');
  ok(A.ovr==='88'&&A.clr==='640,000','代墊款可手動覆蓋（500,000→手續費 88），清空回到自動 640,000');
  ok(A.off.includes('借款15,080,000 元？')&&A.off.includes('另您於10/28日交易之賣超淨收金額為33,674,289元'),'非循環：同樣第一段格式');}
 for(const n of Object.keys(B.shots)){if(!A.shots[n]){ok(false,'缺截圖 '+n);continue}
  const x=PNG.sync.read(fs.readFileSync(A.shots[n])),y=PNG.sync.read(fs.readFileSync(B.shots[n]));
  if(x.width!==y.width||x.height!==y.height){ok(false,`截圖 ${n} 尺寸不同`);continue}
  const d=new PNG({width:x.width,height:x.height});const diff=pm(x.data,y.data,d.data,x.width,x.height,{threshold:0.1});
  if(diff)fs.writeFileSync(`${out}/diff_${n}.png`,PNG.sync.write(d));if(process.env.ALLOW_VISUAL_DIFF&&diff)console.log(`DIFF 截圖 ${n} 有 ${diff} 像素不同（內容有改，請看 diff_${n}.png 確認是預期的變動）`);else ok(diff===0,`截圖 ${n} 像素差異 ${diff}`)}
 console.log(fail?`驗證失敗 ${fail} 項`:'全部驗證通過');process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(1)});
