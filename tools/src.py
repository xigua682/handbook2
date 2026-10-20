#!/usr/bin/env python3
"""百寶袋明文原始檔 <-> 部署用明文 的轉換。不碰密碼、不碰加密。
  expand   <部署明文.html> <src.html>            把壓縮的 PROCS（卡片資料）展開成可讀 JSON
  assemble <src.html> <部署明文.html> [參考明文]   把可讀 JSON 壓回 gzip+base64；資料沒變時沿用參考檔的壓縮字串（輸出逐位元相同）
"""
import sys, re, json, gzip, base64
WRAP = re.compile(r'JSON\.parse\(new TextDecoder\(\)\.decode\(__gz\(Uint8Array\.from\(atob\("([A-Za-z0-9+/=]+)"\),c=>c\.charCodeAt\(0\)\)\)\)\)')
B, E = '/*@@PROCS_JSON_BEGIN@@ 卡片資料：直接改這段 JSON，build 時自動壓縮 */', '/*@@PROCS_JSON_END@@*/'
SRC = re.compile(re.escape(B) + r'\n(.*?)\n' + re.escape(E), re.S)
def compact(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode()
def blob_json(html):
    m = WRAP.search(html); return m, (gzip.decompress(base64.b64decode(m.group(1))) if m else None)
def expand(a, b):
    s = open(a, encoding='utf-8').read(); m, raw = blob_json(s)
    if not m: sys.exit('找不到壓縮的 PROCS')
    data = json.loads(raw); assert compact(data) == raw, 'JSON 無法逐位元還原，停止'
    s = s[:m.start()] + B + '\n' + json.dumps(data, ensure_ascii=False, indent=1) + '\n' + E + s[m.end():]
    open(b, 'w', encoding='utf-8').write(s); print(f'expand OK: {len(data)} 張卡片 -> {b}')
def assemble(a, b, ref=None):
    s = open(a, encoding='utf-8').read(); m = SRC.search(s)
    if not m: sys.exit('原始檔找不到 PROCS 標記')
    raw = compact(json.loads(m.group(1)))  # JSON 格式錯誤會在這裡直接報錯
    b64 = None
    if ref:
        rm, rraw = blob_json(open(ref, encoding='utf-8').read())
        if rraw == raw: b64 = rm.group(1)
    if b64 is None: b64 = base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode()
    out = s[:m.start()] + f'JSON.parse(new TextDecoder().decode(__gz(Uint8Array.from(atob("{b64}"),c=>c.charCodeAt(0)))))' + s[m.end():]
    open(b, 'w', encoding='utf-8').write(out); print('assemble OK' + ('（卡片資料未變，沿用原壓縮字串）' if ref and b64 == rm.group(1) else '（卡片資料已重新壓縮）'))
if __name__ == '__main__':
    c, *a = sys.argv[1:]; {'expand': expand, 'assemble': assemble}[c](*a)
