<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>I.A de Vendas — Instructiva</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--br:#ff6b1a;--brh:#e8590c;--brl:rgba(255,107,26,.08);--brb:rgba(255,107,26,.18);--bg:#0a0a0b;--w:#16171a;--s2:#22232a;--b1:#22232a;--b2:#2c2d35;--b3:#3a3b44;--t1:#f5f5f7;--t2:#a1a1aa;--t3:#71717a;--t4:#52525b;--gr:#10b981;--grl:rgba(16,185,129,.12);--grb:rgba(16,185,129,.25);--rd:#ef4444;--rdl:rgba(239,68,68,.12);--rdb:rgba(239,68,68,.25);--yw:#f59e0b;--ywl:rgba(245,158,11,.12);--ywb:rgba(245,158,11,.25);--pu:#8b5cf6;--pul:rgba(139,92,246,.12);--pub:rgba(139,92,246,.25);--bl:#3b82f6;--bll:rgba(59,130,246,.12);--blb:rgba(59,130,246,.25);--shl:0 24px 48px rgba(0,0,0,.5);--glow:0 0 24px rgba(255,107,26,.25);--rxl:16px;--r2xl:20px;--sw:240px}
[data-theme="light"]{--bg:#fafafa;--w:#fff;--s2:#f4f4f5;--b1:#e4e4e7;--b2:#d4d4d8;--b3:#a1a1aa;--t1:#09090b;--t2:#52525b;--t3:#71717a;--t4:#a1a1aa;--grl:#dcfce7;--grb:#bbf7d0;--rdl:#fee2e2;--rdb:#fecaca;--ywl:#fef3c7;--ywb:#fde68a;--pul:#ede9fe;--pub:#ddd6fe;--bll:#dbeafe;--blb:#bfdbfe;--brl:#fff7ed;--brb:#fed7aa;--shl:0 16px 40px rgba(0,0,0,.1)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;-webkit-font-smoothing:antialiased}
body{font-family:'Geist',-apple-system,sans-serif;background:var(--bg);color:var(--t1);min-height:100vh;letter-spacing:-.011em;font-feature-settings:"ss01","ss03","cv11";transition:background .2s;position:relative}
body::before{content:'';position:fixed;inset:0;background-image:radial-gradient(ellipse 900px 600px at 10% 0%,rgba(255,107,26,.15),transparent 55%),radial-gradient(ellipse 800px 700px at 95% 30%,rgba(139,92,246,.10),transparent 60%),radial-gradient(ellipse 700px 500px at 50% 100%,rgba(16,185,129,.08),transparent 55%);pointer-events:none;z-index:0}
[data-theme="light"] body::before{background-image:radial-gradient(ellipse 800px 500px at 10% 0%,rgba(255,107,26,.10),transparent 55%),radial-gradient(ellipse 700px 600px at 95% 30%,rgba(139,92,246,.06),transparent 60%),radial-gradient(ellipse 600px 500px at 50% 100%,rgba(16,185,129,.05),transparent 55%)}
body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 90% 70% at center,black,transparent);pointer-events:none;z-index:0}
[data-theme="light"] body::after{background-image:linear-gradient(rgba(0,0,0,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.03) 1px,transparent 1px)}
.sidebar,.main,.modal,.login-box,#login-screen,#register-screen{position:relative;z-index:1}
#login-screen{position:fixed;inset:0;z-index:9999;background:radial-gradient(ellipse at top,rgba(255,107,26,.15),transparent 50%),var(--bg);display:flex;align-items:center;justify-content:center;padding:20px}
.login-box{background:var(--w);border:1px solid var(--b1);border-radius:24px;padding:44px 40px;width:420px;max-width:100%;box-shadow:0 32px 64px rgba(0,0,0,.4);animation:popIn .5s cubic-bezier(.16,1,.3,1)}
@keyframes popIn{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.login-logo{text-align:center;margin-bottom:32px}
.login-mark{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--br),#ff8c42);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#fff;box-shadow:0 8px 24px rgba(255,107,26,.4)}
.login-logo h1{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--t1)}
.login-logo p{font-size:13px;color:var(--t3);margin-top:4px;font-weight:500}
.login-field{margin-bottom:16px}
.login-label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px}
.login-input{width:100%;background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--t1);font-family:'Geist',sans-serif;font-weight:500;outline:none;transition:all .2s}
.login-input:focus{border-color:var(--br);box-shadow:0 0 0 3px var(--brl)}
.login-input::placeholder{color:var(--t4)}
.login-btn{width:100%;background:var(--br);color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;margin-top:8px;font-family:'Geist',sans-serif}
.login-btn:hover{background:var(--brh);box-shadow:var(--glow);transform:translateY(-1px)}
.login-err{background:var(--rdl);border:1px solid var(--rdb);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--rd);margin-bottom:14px;display:none;font-weight:500}
.login-register-link{text-align:center;margin-top:18px;font-size:13px;color:var(--t3);font-weight:500}
.login-register-link a{color:var(--br);font-weight:600;cursor:pointer}
#register-screen{position:fixed;inset:0;z-index:10000;background:radial-gradient(ellipse at top,rgba(255,107,26,.15),transparent 50%),var(--bg);display:none;align-items:center;justify-content:center;padding:20px}
#register-screen.open{display:flex}
#app{display:none;flex-direction:row;min-height:100vh}
#app.show{display:flex}
.sidebar{width:var(--sw);height:100vh;background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 80%,var(--br) 20%) 100%);border-right:1px solid var(--b1);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:100;box-shadow:1px 0 0 rgba(255,107,26,.15),4px 0 24px rgba(0,0,0,.2)}
[data-theme="light"] .sidebar{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 94%,var(--br) 6%) 100%);box-shadow:1px 0 0 rgba(255,107,26,.05),4px 0 24px rgba(0,0,0,.03)}
.s-head{padding:20px 18px 14px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between}
.s-brand{display:flex;align-items:center;gap:10px}
.s-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--br),#ff8c42);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(255,107,26,.3)}
.s-brand-name{font-size:14px;font-weight:700;letter-spacing:-.02em}
.theme-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--b1);background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t2);transition:all .15s}
.theme-btn:hover{background:var(--s2);color:var(--t1)}
.theme-btn svg{width:14px;height:14px}
.is{display:none}.im{display:block}
[data-theme="light"] .is{display:block}[data-theme="light"] .im{display:none}
.ws-pill{margin:12px 14px;padding:9px 12px;background:var(--bg);border:1px solid var(--b1);border-radius:10px;display:flex;align-items:center;gap:10px}
.ws-av{width:24px;height:24px;border-radius:6px;background:var(--br);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ws-nm{font-size:12px;font-weight:600;color:var(--t1);flex:1}
.ws-st{width:6px;height:6px;border-radius:50%;background:var(--gr);box-shadow:0 0 8px var(--gr)}
.nav{flex:1;padding:8px 12px;overflow-y:auto}
.nl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t4);padding:14px 10px 6px}
.ni{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;cursor:pointer;color:var(--t2);font-size:13px;font-weight:500;transition:all .12s;margin-bottom:2px;border:none;background:none;width:100%;text-align:left;position:relative}
.ni:hover{background:var(--s2);color:var(--t1)}
.ni.active{background:var(--brl);color:var(--br);font-weight:600}
.ni.active::before{content:'';position:absolute;left:-12px;top:50%;transform:translateY(-50%);width:3px;height:18px;background:var(--br);border-radius:0 3px 3px 0}
.ni svg{width:16px;height:16px;flex-shrink:0;stroke-width:1.8}
.nbadge{margin-left:auto;font-size:10px;font-weight:700;background:var(--br);color:#fff;padding:2px 7px;border-radius:20px}
.s-foot{padding:12px 14px;border-top:1px solid var(--b1)}
.u-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;cursor:pointer;transition:all .12s}
.u-row:hover{background:var(--s2)}
.u-pic{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--br),#ff8c42);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.u-pic img{width:100%;height:100%;object-fit:cover}
.u-name{font-size:13px;font-weight:600;color:var(--t1)}
.u-role{font-size:11px;color:var(--t3);font-weight:500}
.main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{height:60px;background:rgba(10,10,11,.65);border-bottom:1px solid var(--b1);display:flex;align-items:center;padding:0 28px;gap:12px;position:sticky;top:0;z-index:50;backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%)}
[data-theme="light"] .topbar{background:rgba(255,255,255,.65);box-shadow:0 1px 0 rgba(0,0,0,.04)}
.tb-title{font-size:16px;font-weight:700;color:var(--t1);flex:1;letter-spacing:-.02em}
.content{flex:1;padding:24px 28px}
.page{display:none}
.page.active{display:block;animation:fadeUp .3s cubic-bezier(.16,1,.3,1)}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.btn{display:inline-flex;align-items:center;gap:7px;font-family:'Geist',sans-serif;font-size:13px;font-weight:600;padding:8px 14px;border-radius:9px;cursor:pointer;transition:all .15s;border:none;letter-spacing:-.01em;line-height:1}
.btn svg{width:14px;height:14px;stroke-width:2}
.btn-g{background:var(--w);border:1px solid var(--b1);color:var(--t1)}
.btn-g:hover{border-color:var(--b2);background:var(--s2)}
.btn-p{background:linear-gradient(135deg,var(--br) 0%,#ff8c42 100%);color:#fff;box-shadow:0 1px 2px rgba(255,107,26,.3),0 4px 12px rgba(255,107,26,.18)}
.btn-p:hover{box-shadow:0 4px 12px rgba(255,107,26,.4),0 8px 24px rgba(255,107,26,.25);transform:translateY(-1px)}
.btn-r{background:var(--rdl);border:1px solid var(--rdb);color:var(--rd)}
.btn-r:hover{background:var(--rdb)}
.btn-sm{padding:6px 11px;font-size:12px}
.btn-xs{padding:4px 9px;font-size:11px}
.dash-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.dash-title{font-size:26px;font-weight:900;letter-spacing:-.04em}
.dash-sub{font-size:13px;color:var(--t3);margin-top:4px;font-weight:500}
.dash-actions{display:flex;gap:8px;flex-wrap:wrap}
.period-bar{display:flex;align-items:center;gap:6px;background:var(--w);border:1px solid var(--b1);border-radius:11px;padding:5px;margin-bottom:24px;flex-wrap:wrap}
.period-btn{padding:7px 14px;font-size:12px;font-weight:600;color:var(--t2);border-radius:7px;cursor:pointer;transition:all .15s;border:none;background:none;font-family:'Geist',sans-serif}
.period-btn:hover{color:var(--t1)}
.period-btn.active{background:var(--br);color:#fff}
.period-divider{width:1px;height:20px;background:var(--b1);margin:0 4px}
.period-custom{display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg);border:1px solid var(--b1);border-radius:7px}
.period-custom input{background:none;border:none;outline:none;font-size:12px;color:var(--t1);font-family:'Geist',sans-serif;width:120px;font-weight:500}
.period-custom input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7);cursor:pointer}
[data-theme="light"] .period-custom input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
.kpi{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 75%,var(--br) 25%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);padding:22px;position:relative;overflow:hidden;transition:all .3s cubic-bezier(.16,1,.3,1);box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .kpi{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 92%,var(--br) 8%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 8px rgba(0,0,0,.03)}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.7}
[data-theme="light"] .kpi::before{opacity:.4}
.kpi:hover{border-color:rgba(255,107,26,.4);transform:translateY(-3px);box-shadow:0 12px 32px rgba(255,107,26,.25),0 4px 12px rgba(0,0,0,.2)}
[data-theme="light"] .kpi:hover{box-shadow:0 8px 24px rgba(255,107,26,.12),0 4px 12px rgba(0,0,0,.06)}
.kpi-clickable{cursor:pointer}
.kpi-clickable:hover{border-color:var(--br);box-shadow:0 16px 40px rgba(255,107,26,.35),0 4px 16px rgba(0,0,0,.25)}
[data-theme="light"] .kpi-clickable:hover{box-shadow:0 12px 32px rgba(255,107,26,.18),0 4px 16px rgba(0,0,0,.08)}
.kpi-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.kpi-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 1px 2px rgba(0,0,0,.04)}
.kpi-icon svg{width:18px;height:18px;stroke-width:2}
.kpi-arrow{color:var(--t3);transition:transform .2s}
.kpi-clickable:hover .kpi-arrow{transform:translateX(4px);color:var(--br)}
.kpi-arrow svg{width:16px;height:16px}
.kpi-l{font-size:11px;color:var(--t2);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.kpi-n{font-size:30px;font-weight:900;color:var(--t1);line-height:1;letter-spacing:-.04em;font-feature-settings:"tnum","ss01";margin-bottom:6px}
.kpi-sub{font-size:12px;color:var(--t3);font-weight:500}
.invest-detail{background:var(--w);border:1px solid var(--b1);border-radius:var(--rxl);overflow:hidden;margin-bottom:24px;display:none}
.invest-detail.open{display:block;animation:fadeUp .3s cubic-bezier(.16,1,.3,1)}
.invest-hd{padding:18px 22px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between}
.invest-t{font-size:15px;font-weight:700;letter-spacing:-.02em}
.invest-list{padding:8px 0}
.invest-item{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid var(--b1);transition:background .12s}
.invest-item:last-child{border-bottom:none}
.invest-item:hover{background:var(--s2)}
.invest-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.invest-info{flex:1;min-width:0}
.invest-nm{font-size:13px;font-weight:600;color:var(--t1);margin-bottom:2px}
.invest-ds{font-size:11px;color:var(--t3);font-weight:500}
.invest-vl{font-size:15px;font-weight:700;color:var(--t1);font-feature-settings:"tnum"}
.invest-pct{font-size:11px;color:var(--t3);font-weight:500;text-align:right;width:50px}
.invest-actions{padding:14px 22px;border-top:1px solid var(--b1);display:flex;gap:8px}
.dash-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 78%,var(--br) 22%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);overflow:hidden;position:relative;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 96%,var(--br) 4%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
[data-theme="light"] .card{box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.3}
.ch{padding:18px 22px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between}
.ct{font-size:14px;font-weight:700;color:var(--t1);letter-spacing:-.02em}
.cs{font-size:11px;color:var(--t3);font-weight:500}
.cb{padding:18px 22px}
.fb{display:flex;align-items:center;gap:14px;padding:9px 0;border-bottom:1px solid var(--b1)}
.fb:last-child{border-bottom:none}
.fn{font-size:12px;color:var(--t2);width:100px;flex-shrink:0;text-transform:capitalize;font-weight:500}
.ft{flex:1;height:8px;background:var(--bg);border-radius:4px;overflow:hidden}
.ff{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.16,1,.3,1);background:linear-gradient(90deg,var(--br),#ff8c42)}
.fv{font-size:13px;font-weight:700;color:var(--t1);width:30px;text-align:right;font-feature-settings:"tnum"}
.fi-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--b1);align-items:flex-start}
.fi-row:last-child{border-bottom:none}
.fav{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.fb2{flex:1;min-width:0}
.flbl{font-size:13px;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;font-weight:500}
.ft2{font-size:11px;color:var(--t3);font-weight:500}
.inbox-wrap{height:calc(100vh - 100px);display:flex;overflow:hidden;background:var(--w);border:1px solid var(--b1);border-radius:var(--rxl);box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03);position:relative}
.inbox-wrap::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.4;z-index:1}
.inbox-left{width:300px;border-right:1px solid var(--b1);display:flex;flex-direction:column;overflow:hidden}
.ilh{padding:14px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between}
.ilt{font-size:14px;font-weight:700;letter-spacing:-.02em}
.itabs{display:flex;border-bottom:1px solid var(--b1)}
.itab{flex:1;padding:10px 4px;font-size:12px;font-weight:600;color:var(--t3);border-bottom:2px solid transparent;cursor:pointer;text-align:center;transition:all .15s}
.itab:hover{color:var(--t2)}
.itab.active{color:var(--br);border-bottom-color:var(--br)}
.isearch{padding:10px 14px;border-bottom:1px solid var(--b1)}
.si{width:100%;background:var(--bg);border:1px solid var(--b1);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--t1);font-family:'Geist',sans-serif;outline:none;transition:all .15s;font-weight:500}
.si:focus{border-color:var(--br);box-shadow:0 0 0 3px var(--brl)}
.si::placeholder{color:var(--t4)}
.ilist{flex:1;overflow-y:auto}
.ci{padding:12px 14px;border-bottom:1px solid var(--b1);cursor:pointer;display:flex;gap:10px;transition:background .12s}
.ci:hover{background:var(--s2)}
.ci.active{background:var(--brl)}
.cav{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--bl),var(--pu));color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;font-weight:700}
.cinfo{flex:1;min-width:0}
.cnm{font-size:13px;font-weight:600;color:var(--t1);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cprev{font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.cmeta{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.ctime{font-size:10px;color:var(--t4);font-weight:500}
.chat-area{flex:1;display:flex;flex-direction:column;background:var(--bg);overflow:hidden}
.chat-tb{padding:14px 20px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;background:var(--w);gap:12px}
.chat-info{flex:1;min-width:0;display:flex;align-items:center;gap:12px}
.chat-info-av{width:38px;height:38px;border-radius:11px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;letter-spacing:-.02em}
.chat-info-text{flex:1;min-width:0}
.chat-info-name{font-size:14px;font-weight:700;letter-spacing:-.02em}
.chat-info-st{font-size:11px;color:var(--t3);margin-top:2px;font-weight:500;display:flex;align-items:center;gap:5px}
.chat-msgs{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:10px}
.mg{display:flex;flex-direction:column}
.mg.user{align-items:flex-start}
.mg.assistant{align-items:flex-end}
.bub{max-width:70%;padding:11px 15px;border-radius:14px;font-size:13px;line-height:1.55;letter-spacing:-.01em;box-shadow:0 1px 2px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)}
[data-theme="light"] .bub{box-shadow:0 1px 2px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)}
.bub.user{background:var(--w);border:1px solid var(--b1);border-bottom-left-radius:4px}
.bub.assistant{background:linear-gradient(135deg,var(--br) 0%,#ff8c42 100%);color:#fff;border-bottom-right-radius:4px;box-shadow:0 2px 8px rgba(255,107,26,.25),0 8px 24px rgba(255,107,26,.12)}
.bt{font-size:10px;color:var(--t4);padding:0 4px;margin-top:4px;font-weight:500}
.chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--t3)}
.chat-empty p{font-size:13px;font-weight:500}
.page-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px}
.page-title{font-size:22px;font-weight:800;letter-spacing:-.03em}
.page-sub{font-size:13px;color:var(--t3);margin-top:4px;font-weight:500}
.tw{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 96%,var(--br) 4%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);overflow:hidden;position:relative;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03)}
.tw::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.4}
.tth{padding:14px 18px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px}
table{width:100%;border-collapse:collapse}
th{padding:11px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);border-bottom:1px solid var(--b1)}
td{padding:13px 16px;font-size:13px;color:var(--t1);border-bottom:1px solid var(--b1);font-weight:500}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--s2)}
.pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;text-transform:capitalize}
.pill-b{background:var(--bll);color:var(--bl);border:1px solid var(--blb)}
.pill-g{background:var(--grl);color:var(--gr);border:1px solid var(--grb)}
.pill-y{background:var(--ywl);color:var(--yw);border:1px solid var(--ywb)}
.pill-r{background:var(--rdl);color:var(--rd);border:1px solid var(--rdb)}
.pill-p{background:var(--pul);color:var(--pu);border:1px solid var(--pub)}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block}
.dot-g{background:var(--gr)}
.agents-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ag{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 75%,var(--br) 25%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);padding:22px;transition:all .3s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .ag{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 94%,var(--br) 6%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
[data-theme="light"] .ag{box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.ag::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.5}
.ag:hover{border-color:rgba(255,107,26,.3);transform:translateY(-3px);box-shadow:0 12px 32px rgba(255,107,26,.12),0 4px 12px rgba(0,0,0,.05)}
.ag-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
.ag-icn{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,var(--br),#ff8c42);color:#fff;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center}
.ag-st{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--gr);font-weight:600}
.ag-name{font-size:15px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
.ag-role{font-size:12px;color:var(--t2);margin-bottom:14px;line-height:1.5;font-weight:500}
.ag-acts{display:flex;gap:8px}
.empty-state{text-align:center;padding:60px 20px;color:var(--t3);background:var(--w);border:1px dashed var(--b2);border-radius:var(--rxl)}
.empty-state h3{font-size:16px;font-weight:700;color:var(--t2);margin-bottom:6px;letter-spacing:-.02em}
.empty-state p{font-size:13px;line-height:1.6;font-weight:500}
.cfg-grid{display:grid;grid-template-columns:220px 1fr;gap:18px}
.cfg-nav{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 96%,var(--br) 4%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);overflow:hidden;height:fit-content;padding:6px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.cfg-ni{padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--t2);transition:all .12s;display:flex;align-items:center;gap:10px;margin-bottom:2px}
.cfg-ni:hover{background:var(--s2);color:var(--t1)}
.cfg-ni.active{background:var(--brl);color:var(--br);font-weight:600}
.cfg-ni svg{width:15px;height:15px;flex-shrink:0;stroke-width:1.8}
.cfg-panel{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 96%,var(--br) 4%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);overflow:hidden;position:relative;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03)}
.cfg-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.4}
.cfg-ph{padding:20px 24px;border-bottom:1px solid var(--b1)}
.cfg-pt{font-size:16px;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}
.cfg-ps{font-size:12px;color:var(--t3);font-weight:500}
.cfg-pb{padding:24px}
.cfg-sec{margin-bottom:26px;padding-bottom:26px;border-bottom:1px solid var(--b1)}
.cfg-sec:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.cfg-sec-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:14px}
.fg{margin-bottom:14px}
.fl-l{display:block;font-size:11.5px;font-weight:600;color:var(--t2);margin-bottom:7px;letter-spacing:.005em;text-transform:none}
.fi,.fta,.fsel{width:100%;background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:11px 14px;font-size:13.5px;color:var(--t1);font-family:'Geist',sans-serif;outline:none;transition:all .15s;font-weight:500;letter-spacing:-.01em}
.fi:focus,.fta:focus,.fsel:focus{border-color:var(--br);box-shadow:0 0 0 3px var(--brl);background:var(--w)}
.fta{resize:vertical;min-height:90px;line-height:1.6}
.fsel{cursor:pointer}
.fmono{font-family:'Geist Mono',monospace;font-size:12px}
.fr2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.avatar-upload{display:flex;align-items:center;gap:18px}
.avatar-big{width:68px;height:68px;border-radius:14px;background:linear-gradient(135deg,var(--br),#ff8c42);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:800;overflow:hidden;flex-shrink:0}
.avatar-big img{width:100%;height:100%;object-fit:cover}
.mbg{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:500;display:none;align-items:center;justify-content:center;padding:20px}
.mbg.open{display:flex;animation:bgIn .25s ease}
@keyframes bgIn{from{opacity:0}to{opacity:1}}
.modal{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 96%,var(--br) 4%) 100%);border:1px solid var(--b1);border-radius:var(--r2xl);padding:30px;width:560px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 64px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.05);animation:modalIn .3s cubic-bezier(.16,1,.3,1);position:relative;overflow-x:hidden}
[data-theme="light"] .modal{box-shadow:0 32px 64px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.04)}
.modal::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.6;border-radius:var(--r2xl) var(--r2xl) 0 0}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal.sm{width:440px}
.modal.lg{width:760px}
.mt{font-size:20px;font-weight:900;color:var(--t1);margin-bottom:5px;letter-spacing:-.03em}
.ms{font-size:13.5px;color:var(--t3);margin-bottom:22px;font-weight:500;letter-spacing:-.005em}
.macts{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}
.sec-div{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--br);display:flex;align-items:center;gap:10px;margin:18px 0 14px}
.sec-div::after{content:'';flex:1;height:1px;background:var(--b1)}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--b3);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--t4)}
.hero{position:relative;background:linear-gradient(135deg,#0a0a0b 0%,#1a0e08 60%,#2d1810 100%);border:1px solid var(--b1);border-radius:28px;padding:48px 44px;margin-bottom:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.4),0 0 0 1px rgba(255,107,26,.08)}
[data-theme="light"] .hero{background:linear-gradient(135deg,#fff 0%,#fff5ed 50%,#ffe4d3 100%);box-shadow:0 24px 64px rgba(255,107,26,.12),0 0 0 1px rgba(255,107,26,.1)}
.hero::before{content:'';position:absolute;top:-50%;right:-20%;width:600px;height:600px;background:radial-gradient(circle,rgba(255,107,26,.12) 0%,transparent 60%);pointer-events:none;animation:pulse 8s ease-in-out infinite}
.hero::after{content:'';position:absolute;bottom:-40%;left:-10%;width:500px;height:500px;background:radial-gradient(circle,rgba(255,140,66,.08) 0%,transparent 70%);pointer-events:none}
@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
.hero-grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse at center,black 0%,transparent 70%)}
[data-theme="light"] .hero-grid-bg{background-image:linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)}
.hero-content{position:relative;z-index:1}
.hero-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(255,107,26,.12);border:1px solid rgba(255,107,26,.3);border-radius:99px;padding:6px 14px;font-size:11px;font-weight:600;color:var(--br);letter-spacing:-.01em;margin-bottom:18px}
.hero-pill .live-dot{width:6px;height:6px;border-radius:50%;background:var(--gr);box-shadow:0 0 8px var(--gr);animation:livePulse 2s ease-in-out infinite}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.4}}
.hero-greeting{font-size:14px;color:var(--t3);font-weight:500;margin-bottom:8px}
.hero-title{font-size:44px;font-weight:900;letter-spacing:-.04em;line-height:1.05;margin-bottom:14px;background:linear-gradient(135deg,#fff 0%,#a1a1aa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
[data-theme="light"] .hero-title{background:linear-gradient(135deg,#09090b 0%,#52525b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{font-size:16px;color:var(--t2);font-weight:500;line-height:1.55;max-width:520px;margin-bottom:32px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.hero-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;border:none;font-family:'Geist',sans-serif}
.hero-btn svg{width:15px;height:15px;stroke-width:2}
.hero-btn-p{background:linear-gradient(135deg,var(--br),#ff8c42);color:#fff;box-shadow:0 4px 16px rgba(255,107,26,.35)}
.hero-btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,107,26,.5)}
.hero-btn-g{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--t1);backdrop-filter:blur(10px)}
[data-theme="light"] .hero-btn-g{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.08)}
.hero-btn-g:hover{background:rgba(255,255,255,.08);transform:translateY(-2px)}
[data-theme="light"] .hero-btn-g:hover{background:rgba(0,0,0,.06)}
.hero-mini{position:absolute;top:48px;right:44px;display:flex;gap:14px;z-index:1}
.hero-mini-item{text-align:right}
.hero-mini-n{font-size:24px;font-weight:800;color:var(--t1);letter-spacing:-.02em;font-feature-settings:"tnum";line-height:1}
.hero-mini-l{font-size:11px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.08em;margin-top:4px}
.hero-mini-divider{width:1px;background:rgba(255,255,255,.1)}
[data-theme="light"] .hero-mini-divider{background:rgba(0,0,0,.08)}
.home-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.home-card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 72%,var(--br) 28%) 100%);border:1px solid var(--b1);border-radius:18px;padding:24px;transition:all .3s cubic-bezier(.16,1,.3,1);cursor:pointer;position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .home-card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 94%,var(--br) 6%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.home-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--br),transparent);opacity:.6;transition:opacity .3s}
[data-theme="light"] .home-card::before{opacity:0}
.home-card:hover::before{opacity:1}
.home-card:hover{border-color:rgba(255,107,26,.5);transform:translateY(-4px);box-shadow:0 20px 48px rgba(255,107,26,.25),0 4px 16px rgba(0,0,0,.2)}
[data-theme="light"] .home-card:hover{border-color:rgba(255,107,26,.35);box-shadow:0 16px 40px rgba(255,107,26,.18),0 4px 16px rgba(0,0,0,.08)}
.home-card-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.home-card-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center}
.home-card-icon svg{width:18px;height:18px;stroke-width:2}
.home-card-arr{color:var(--t3);transition:all .2s}
.home-card:hover .home-card-arr{color:var(--br);transform:translateX(4px)}
.home-card-arr svg{width:16px;height:16px}
.home-card-t{font-size:15px;font-weight:700;color:var(--t1);letter-spacing:-.02em;margin-bottom:6px}
.home-card-d{font-size:13px;color:var(--t3);font-weight:500;line-height:1.55}
.tpl-grid{display:grid;grid-template-columns:1fr;gap:14px}
.tpl{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 75%,var(--bl) 25%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);padding:22px;transition:all .3s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .tpl{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 95%,var(--bl) 5%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.tpl::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--bl),transparent);opacity:.6}
[data-theme="light"] .tpl::before{opacity:.4}
.tpl:hover{border-color:rgba(59,130,246,.4);transform:translateY(-2px);box-shadow:0 12px 32px rgba(59,130,246,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .tpl:hover{border-color:rgba(59,130,246,.3);box-shadow:0 8px 24px rgba(59,130,246,.1),0 4px 12px rgba(0,0,0,.04)}
.tpl-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.tpl-name{font-size:16px;font-weight:800;color:var(--t1);letter-spacing:-.02em;font-family:'Geist',sans-serif;line-height:1.3}
.tpl-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--t3);font-weight:500}
.tpl-body{font-size:13px;color:var(--t2);line-height:1.55;background:var(--bg);border:1px solid var(--b1);border-radius:8px;padding:10px 12px;font-weight:500;white-space:pre-wrap;max-height:90px;overflow-y:auto}
.tpl-acts{display:flex;gap:6px}
.tpl-stat-aprovado{background:var(--grl);color:var(--gr);border:1px solid var(--grb)}
.tpl-stat-pendente{background:var(--ywl);color:var(--yw);border:1px solid var(--ywb)}
.tpl-stat-rejeitado{background:var(--rdl);color:var(--rd);border:1px solid var(--rdb)}
.tpl-stat-pausado{background:var(--pul);color:var(--pu);border:1px solid var(--pub)}
.camp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.camp{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 75%,var(--pu) 25%) 100%);border:1px solid var(--b1);border-radius:var(--rxl);padding:22px;transition:all .3s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .camp{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 94%,var(--pu) 6%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
[data-theme="light"] .camp{box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.camp::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--pu),transparent);opacity:.4}
.camp:hover{border-color:rgba(139,92,246,.3);transform:translateY(-3px);box-shadow:0 12px 32px rgba(139,92,246,.12),0 4px 12px rgba(0,0,0,.05)}
.camp-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}
.camp-name{font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.02em;line-height:1.3}
.camp-desc{font-size:12px;color:var(--t3);font-weight:500;margin-top:3px}
.camp-meta{font-size:11px;color:var(--t3);font-weight:500;font-family:'Geist Mono',monospace;margin-top:8px}
.camp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0;padding:14px 0;border-top:1px solid var(--b1);border-bottom:1px solid var(--b1)}
.camp-st{text-align:center}
.camp-stn{font-size:18px;font-weight:800;color:var(--t1);font-feature-settings:"tnum";letter-spacing:-.02em}
.camp-stl{font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
.camp-acts{display:flex;gap:6px;flex-wrap:wrap}
.camp-stat-rascunho{background:var(--s2);color:var(--t2);border:1px solid var(--b2)}
.camp-stat-disparando{background:var(--ywl);color:var(--yw);border:1px solid var(--ywb)}
.camp-stat-concluida{background:var(--grl);color:var(--gr);border:1px solid var(--grb)}
.camp-stat-pausada{background:var(--pul);color:var(--pu);border:1px solid var(--pub)}
.camp-stat-erro{background:var(--rdl);color:var(--rd);border:1px solid var(--rdb)}
.drop-zone{border:2px dashed var(--b2);border-radius:12px;padding:30px 20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg)}
.drop-zone:hover,.drop-zone.dragover{border-color:var(--br);background:var(--brl)}
.drop-zone svg{width:36px;height:36px;color:var(--t3);margin:0 auto 10px}
.drop-zone h4{font-size:14px;font-weight:700;color:var(--t1);margin-bottom:4px}
.drop-zone p{font-size:12px;color:var(--t3);font-weight:500;line-height:1.5}
.csv-preview{margin-top:14px;background:var(--bg);border:1px solid var(--b1);border-radius:9px;padding:12px;font-size:12px;font-family:'Geist Mono',monospace;max-height:160px;overflow-y:auto}
.csv-preview-row{padding:4px 0;color:var(--t2);border-bottom:1px solid var(--b1)}
.csv-preview-row:last-child{border-bottom:none}
.csv-preview-row strong{color:var(--t1)}
.bm-card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 78%,var(--gr) 22%) 100%);border:1px solid var(--b1);border-radius:var(--r2xl);padding:24px;margin-bottom:16px;position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15)}
[data-theme="light"] .bm-card{background:linear-gradient(180deg,var(--w) 0%,color-mix(in srgb,var(--w) 95%,var(--gr) 5%) 100%);box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.03)}
.bm-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gr),transparent);opacity:.4}
.bm-h{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:14px;flex-wrap:wrap}
.bm-title{font-size:18px;font-weight:800;letter-spacing:-.02em}
.bm-id{font-size:11px;color:var(--t3);font-family:'Geist Mono',monospace;font-weight:500;margin-top:4px}
.bm-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:18px 0;padding:18px 0;border-top:1px solid var(--b1);border-bottom:1px solid var(--b1)}
.bm-info-item{display:flex;flex-direction:column;gap:4px}
.bm-info-l{font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.bm-info-v{font-size:14px;color:var(--t1);font-weight:600;letter-spacing:-.01em}
.phone-card{background:var(--bg);border:1px solid var(--b1);border-radius:11px;padding:16px;margin-bottom:10px}
.phone-h{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.phone-num{font-size:16px;font-weight:800;letter-spacing:-.02em}
.phone-name{font-size:12px;color:var(--t3);font-weight:500;margin-top:2px}
.phone-stats{display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--t3);font-weight:500}
.phone-stat strong{color:var(--t1)}
.cbadge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px}
.cb-ok{background:var(--grl);color:var(--gr);border:1px solid var(--grb)}
.ag-modal-tabs{display:flex;gap:2px;border-bottom:1px solid var(--b1);margin-bottom:22px;overflow-x:auto;background:var(--bg);border-radius:12px 12px 0 0;padding:6px 6px 0}
.ag-modal-tab{padding:11px 16px;font-size:12.5px;font-weight:600;color:var(--t3);background:none;border:none;border-bottom:2px solid transparent;border-radius:9px 9px 0 0;cursor:pointer;white-space:nowrap;transition:all .18s cubic-bezier(.16,1,.3,1);font-family:'Geist',sans-serif;display:flex;align-items:center;gap:6px;letter-spacing:-.01em;margin-bottom:-1px}
.ag-modal-tab:hover{color:var(--t1);background:var(--w)}
.ag-modal-tab.active{color:var(--br);border-bottom-color:var(--br);background:var(--w);font-weight:700}
.ag-pane{display:none}
.ag-pane.active{display:block;animation:fadeUp .25s cubic-bezier(.16,1,.3,1)}
.ag-list-item{background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:14px;margin-bottom:10px;position:relative}
.ag-list-item-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px}
.ag-list-item-num{font-size:11px;font-weight:700;color:var(--br);background:var(--brl);padding:3px 8px;border-radius:6px;letter-spacing:.04em}
.ag-list-add{width:100%;background:var(--brl);border:1px dashed var(--brb);border-radius:10px;padding:14px;font-size:13px;font-weight:600;color:var(--br);cursor:pointer;transition:all .15s;font-family:'Geist',sans-serif;display:flex;align-items:center;justify-content:center;gap:7px}
.ag-list-add:hover{background:var(--brb);border-style:solid}
.ag-rm-btn{background:var(--rdl);border:1px solid var(--rdb);color:var(--rd);width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:14px}
.ag-rm-btn:hover{background:var(--rdb)}
.ag-upload{border:2px dashed var(--b2);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg);margin-bottom:12px}
.ag-upload:hover,.ag-upload.dragover{border-color:var(--br);background:var(--brl)}
.ag-upload svg{width:28px;height:28px;color:var(--t3);margin:0 auto 8px;display:block}
.ag-upload h5{font-size:13px;font-weight:700;color:var(--t1);margin-bottom:3px}
.ag-upload p{font-size:11px;color:var(--t3);font-weight:500}
.ag-files{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.ag-file{background:var(--w);border:1px solid var(--b1);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;font-size:12px}
.ag-file-icn{width:30px;height:30px;border-radius:7px;background:var(--bll);color:var(--bl);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:700}
.ag-file-info{flex:1;min-width:0}
.ag-file-nm{font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ag-file-meta{font-size:10px;color:var(--t3);font-weight:500;margin-top:2px}
.ag-file-rm{background:none;border:none;color:var(--t3);cursor:pointer;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center}
.ag-file-rm:hover{background:var(--rdl);color:var(--rd)}
.ag-pane-hint{font-size:12px;color:var(--t3);font-weight:500;line-height:1.55;margin-bottom:14px;background:var(--brl);border:1px solid var(--brb);border-radius:9px;padding:10px 13px}
.ag-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t2);margin:18px 0 10px;display:flex;align-items:center;gap:8px}
.ag-section-title::before{content:'';width:3px;height:12px;background:var(--br);border-radius:2px}
.ag-or-divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:var(--t3);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.ag-or-divider::before,.ag-or-divider::after{content:'';flex:1;height:1px;background:var(--b1)}
.toast{position:fixed;bottom:24px;right:24px;background:var(--t1);color:var(--bg);padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;transform:translateY(60px);opacity:0;transition:all .25s cubic-bezier(.16,1,.3,1);z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.empty{padding:48px 20px;text-align:center;color:var(--t3)}
.empty p{font-size:13px;font-weight:500}
.ci.paused{border-left:3px solid var(--br);background:var(--brl)}
.ci-paused-badge{display:inline-flex;align-items:center;gap:3px;font-size:9px;color:var(--br);font-weight:700;background:var(--brl);border:1px solid var(--brb);padding:2px 6px;border-radius:5px;margin-top:3px;text-transform:uppercase;letter-spacing:.04em}
.ci-camp-badge{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;color:var(--pu);font-weight:700;background:var(--pul);border:1px solid var(--pub);padding:2px 7px;border-radius:5px;margin-top:4px;text-transform:uppercase;letter-spacing:.03em;max-width:fit-content}
.ci-camp-badge::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--pu);box-shadow:0 0 6px var(--pu)}
.chat-camp-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--pu);font-weight:600;background:var(--pul);border:1px solid var(--pub);padding:3px 9px;border-radius:6px}
.chat-camp-tag::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--pu);box-shadow:0 0 6px var(--pu)}
.chat-pause-banner{background:var(--brl);border-bottom:1px solid var(--brb);padding:10px 20px;font-size:12px;color:var(--br);font-weight:600;display:flex;align-items:center;gap:8px}
.chat-input-bar{padding:14px 20px;background:var(--w);border-top:1px solid var(--b1);display:flex;gap:8px;align-items:flex-end}
.chat-input-bar textarea{flex:1;background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--t1);font-family:'Geist',sans-serif;outline:none;resize:none;min-height:40px;max-height:120px;line-height:1.5}
.chat-input-bar textarea:focus{border-color:var(--br);box-shadow:0 0 0 3px var(--brl)}
.chat-input-bar button{height:40px;flex-shrink:0}
.btn-pause{background:var(--brl);border:1px solid var(--brb);color:var(--br)}
.btn-pause:hover{background:var(--brb)}
.btn-resume{background:var(--grl);border:1px solid var(--grb);color:var(--gr)}
.btn-resume:hover{background:var(--grb)}
.btn[disabled],.no-perm{opacity:.45;cursor:not-allowed!important;pointer-events:none}
.no-perm-wrap{position:relative;display:inline-block}
.no-perm-wrap[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--t1);color:var(--bg);padding:5px 9px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;z-index:1000;pointer-events:none}
.role-pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em}
.role-admin{background:var(--brl);color:var(--br);border:1px solid var(--brb)}
.role-operador{background:var(--bll);color:var(--bl);border:1px solid var(--blb)}
.role-observador{background:var(--pul);color:var(--pu);border:1px solid var(--pub)}
.user-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid var(--b1);transition:background .12s}
.user-row:last-child{border-bottom:none}
.user-row:hover{background:var(--s2)}
.user-row-av{width:38px;height:38px;border-radius:11px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.user-row-info{flex:1;min-width:0}
.user-row-name{font-size:13.5px;font-weight:700;color:var(--t1);letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
.user-row-meta{font-size:12px;color:var(--t3);font-weight:500;margin-top:2px;display:flex;align-items:center;gap:6px}
.user-row-actions{display:flex;gap:6px}
.role-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.role-card{background:var(--bg);border:2px solid var(--b1);border-radius:11px;padding:14px;cursor:pointer;transition:all .2s;text-align:center}
.role-card:hover{border-color:var(--b2)}
.role-card.selected{border-color:var(--br);background:var(--brl);box-shadow:0 0 0 3px var(--brl)}
.role-card-icon{font-size:22px;margin-bottom:6px}
.role-card-name{font-size:13px;font-weight:700;color:var(--t1);margin-bottom:3px}
.role-card-desc{font-size:10.5px;color:var(--t3);font-weight:500;line-height:1.4}
@media (max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.agents-grid,.tpl-grid,.camp-grid{grid-template-columns:1fr}.dash-cols,.cfg-grid,.fr2{grid-template-columns:1fr}.hero{padding:32px 24px}.hero-title{font-size:32px}.hero-mini{display:none}.home-cards{grid-template-columns:1fr}}
</style>
</head>
<body>
<div id="login-screen"><div class="login-box"><div class="login-logo"><div class="login-mark">I</div><h1>I.A de Vendas</h1><p>INSTRUCTIVA</p></div><div class="login-err" id="login-err">Usuário ou senha incorretos</div><div class="login-field"><label class="login-label">E-mail</label><input class="login-input" id="l-email" type="email" placeholder="seu@email.com" onkeydown="if(event.key==='Enter')doLogin()"></div><div class="login-field"><label class="login-label">Senha</label><input class="login-input" id="l-pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"></div><button class="login-btn" onclick="doLogin()">Entrar</button></div></div>
<div id="app">
<aside class="sidebar"><div class="s-head"><div class="s-brand"><div class="s-mark">I</div><span class="s-brand-name">I.A Vendas</span></div><button class="theme-btn" onclick="toggleTheme()"><svg class="is" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg><svg class="im" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button></div>
<div class="ws-pill"><div class="ws-av">I</div><span class="ws-nm">Instructiva</span><span class="ws-st"></span></div>
<nav class="nav">
<div class="nl">Principal</div>
<button class="ni active" onclick="go('home',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Início</button>
<button class="ni" onclick="go('dashboard',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Dashboard</button>
<button class="ni" onclick="go('inbox',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Caixa de Entrada<span class="nbadge" id="inbox-badge">0</span></button>
<div class="nl">I.A</div>
<button class="ni" onclick="go('agentes',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>Agentes</button>
<div class="nl">Vendas</div>
<button class="ni" onclick="go('disparo',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Disparador</button>
<button class="ni" onclick="go('campanhas',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg>Campanhas</button>
<button class="ni" onclick="go('templates',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Templates</button>
<button class="ni" onclick="go('leads',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Leads</button>
<div class="nl">Sistema</div>
<button class="ni" onclick="go('canais',this)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>Canais</button>
<button class="ni" onclick="go('config',this)"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3"/></svg>Configurações</button>
</nav>
<div class="s-foot"><div class="u-row" onclick="go('config',document.querySelector('[onclick*=config]'))"><div class="u-pic" id="sidebar-av"><span id="sidebar-initials">T</span></div><div><div class="u-name" id="sidebar-name">Thiago</div><div class="u-role" id="sidebar-role">Administrador</div></div></div></div>
</aside>
<main class="main">
<div class="topbar"><span class="tb-title" id="page-title">Início</span><div style="display:flex;gap:8px"><button class="btn btn-g btn-sm" onclick="loadAll()">↻ Atualizar</button></div></div>
<div class="content">
<div class="page active" id="page-home"><div class="hero"><div class="hero-grid-bg"></div><div class="hero-mini"><div class="hero-mini-item"><div class="hero-mini-n" id="hm-conv">—</div><div class="hero-mini-l">Conversas</div></div><div class="hero-mini-divider"></div><div class="hero-mini-item"><div class="hero-mini-n" id="hm-leads">—</div><div class="hero-mini-l">Leads</div></div></div><div class="hero-content"><div class="hero-pill"><span class="live-dot"></span>SISTEMA AO VIVO</div><div class="hero-greeting" id="greeting">Boa noite,</div><div class="hero-title" id="welcome-name">Thiago.</div><div class="hero-sub">Sua central de inteligência de vendas. Cada conversa, cada lead, cada conversão — em um só lugar.</div><div class="hero-actions"><button class="hero-btn hero-btn-p" onclick="go('campanhas',document.querySelector('[onclick*=campanhas]'))"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Nova Campanha</button><button class="hero-btn hero-btn-g" onclick="go('inbox',document.querySelector('[onclick*=inbox]'))"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Caixa de Entrada</button><button class="hero-btn hero-btn-g" onclick="go('dashboard',document.querySelector('[onclick*=dashboard]'))"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Dashboard</button></div></div></div>
<div class="home-cards"><div class="home-card" onclick="go('campanhas',document.querySelector('[onclick*=campanhas]'))"><div class="home-card-h"><div class="home-card-icon" style="background:var(--brl)"><svg fill="none" stroke="var(--br)" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg></div><span class="home-card-arr"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></div><div class="home-card-t">Campanhas</div><div class="home-card-d">Crie disparos em massa com IA conduzindo a conversa até o fechamento.</div></div><div class="home-card" onclick="go('agentes',document.querySelector('[onclick*=agentes]'))"><div class="home-card-h"><div class="home-card-icon" style="background:var(--pul)"><svg fill="none" stroke="var(--pu)" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg></div><span class="home-card-arr"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></div><div class="home-card-t">Agentes IA</div><div class="home-card-d">Treine sua Clara com base de conhecimento, scripts e objeções específicas.</div></div><div class="home-card" onclick="go('dashboard',document.querySelector('[onclick*=dashboard]'))"><div class="home-card-h"><div class="home-card-icon" style="background:var(--grl)"><svg fill="none" stroke="var(--gr)" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div><span class="home-card-arr"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></div><div class="home-card-t">ROI em tempo real</div><div class="home-card-d">Acompanhe investimento, faturamento e conversão por período personalizado.</div></div></div></div>
<div class="page" id="page-dashboard"><div class="dash-hd"><div><div class="dash-title">Dashboard Financeiro</div><div class="dash-sub" id="dash-period-label">Hoje</div></div><div class="dash-actions"><button class="btn btn-g" onclick="openModal('m-gasto')">+ Adicionar Gasto</button><button class="btn btn-p" onclick="openModal('m-venda')">+ Registrar Venda</button></div></div><div class="period-bar"><button class="period-btn active" onclick="setPeriod('hoje',this)">Hoje</button><button class="period-btn" onclick="setPeriod('semana',this)">Esta semana</button><button class="period-btn" onclick="setPeriod('mes',this)">Este mês</button><button class="period-btn" onclick="setPeriod('30dias',this)">Últimos 30 dias</button><div class="period-divider"></div><div class="period-custom"><input type="date" id="period-start" onchange="setPeriodCustom()"><span style="color:var(--t4);font-size:11px">até</span><input type="date" id="period-end" onchange="setPeriodCustom()"></div></div><div class="kpi-grid"><div class="kpi kpi-clickable" onclick="toggleInvestDetail()"><div class="kpi-h"><div class="kpi-icon" style="background:var(--rdl)"><svg fill="none" stroke="var(--rd)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/></svg></div><span class="kpi-arrow"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></div><div class="kpi-l">Investimento</div><div class="kpi-n" id="k-invest">R$ 0,00</div><div class="kpi-sub" id="k-invest-sub">Clique para ver detalhes</div></div><div class="kpi"><div class="kpi-h"><div class="kpi-icon" style="background:var(--bll)"><svg fill="none" stroke="var(--bl)" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div><div class="kpi-l">Faturamento Bruto</div><div class="kpi-n" id="k-bruto">R$ 0,00</div><div class="kpi-sub"><span id="k-bruto-vendas">0</span> vendas</div></div><div class="kpi"><div class="kpi-h"><div class="kpi-icon" style="background:var(--grl)"><svg fill="none" stroke="var(--gr)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/></svg></div></div><div class="kpi-l">Faturamento Líquido</div><div class="kpi-n" id="k-liquido">R$ 0,00</div><div class="kpi-sub">Bruto − Investimento</div></div><div class="kpi"><div class="kpi-h"><div class="kpi-icon" style="background:var(--brl)"><svg fill="none" stroke="var(--br)" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div></div><div class="kpi-l">ROI</div><div class="kpi-n" id="k-roi">—</div><div class="kpi-sub" id="k-roi-sub">Retorno sobre investimento</div></div></div><div class="invest-detail" id="invest-detail"><div class="invest-hd"><div class="invest-t">Detalhamento dos Investimentos</div><button class="btn btn-g btn-sm" onclick="toggleInvestDetail()">Fechar</button></div><div class="invest-list" id="invest-list"></div><div class="invest-actions"><button class="btn btn-p btn-sm" onclick="openModal('m-gasto')">+ Adicionar Gasto</button></div></div><div class="dash-cols"><div class="card"><div class="ch"><span class="ct">Funil de Leads</span><span class="cs">distribuição por estágio</span></div><div class="cb" id="funnel-list"><div style="color:var(--t3);font-size:13px">Carregando...</div></div></div><div class="card"><div class="ch"><span class="ct">Atividade Recente</span><span class="cs">últimas mensagens</span></div><div class="cb" id="feed-list"><div style="color:var(--t3);font-size:13px">Carregando...</div></div></div></div></div>
<div class="page" id="page-inbox"><div class="inbox-wrap"><div class="inbox-left"><div class="ilh"><span class="ilt">Conversas</span><button class="btn btn-g btn-xs" onclick="loadInbox()">↻</button></div><div class="itabs"><div class="itab active" id="it-all" onclick="setTab('all')">Todos</div><div class="itab" id="it-open" onclick="setTab('open')">⏳ Aguardando</div></div><div class="isearch"><input class="si" placeholder="Buscar conversa..." oninput="filterConvs(this.value)"></div><div class="ilist" id="conv-list"><div class="empty"><p>Carregando...</p></div></div></div><div class="chat-area" id="chat-area"><div class="chat-empty"><p>Selecione uma conversa</p></div></div></div></div>
<div class="page" id="page-agentes"><div class="page-hd"><div><div class="page-title">Agentes de I.A</div><div class="page-sub">Crie e treine seus agentes de vendas</div></div><button class="btn btn-p" onclick="openNewAgent()">+ Criar Agente</button></div><div id="agents-container"></div></div>
<div class="page" id="page-disparo"><div class="page-hd"><div><div class="page-title">Disparador</div><div class="page-sub">Use a tela Campanhas para criar e disparar mensagens</div></div></div><div class="empty-state"><h3>O Disparador agora vive em "Campanhas"</h3><p>Cada campanha tem seu próprio template, agente de IA e lista de leads.</p><button class="btn btn-p" style="margin-top:14px" onclick="go('campanhas',document.querySelector('[onclick*=campanhas]'))">→ Ir para Campanhas</button></div></div>
<div class="page" id="page-campanhas"><div class="page-hd"><div><div class="page-title">Campanhas</div><div class="page-sub" id="camp-sub">Disparos em massa com IA conduzindo a conversa</div></div><button class="btn btn-p" onclick="openNewCampanha()">+ Nova Campanha</button></div><div id="campanhas-container"><div class="empty"><p>Carregando campanhas...</p></div></div></div>
<div class="page" id="page-templates"><div class="page-hd"><div><div class="page-title">Templates de Mensagem</div><div class="page-sub" id="tpl-sub">Carregando templates da Meta...</div></div><button class="btn btn-p" onclick="openNewTemplate()">+ Criar Template</button></div><div id="templates-container"><div class="empty"><p>Carregando...</p></div></div></div>
<div class="page" id="page-leads"><div class="page-hd"><div><div class="page-title">Leads</div><div class="page-sub" id="leads-sub">Carregando...</div></div><select class="fsel" style="width:160px" onchange="filterLeads(this.value)"><option value="todos">Todos</option><option value="novo">Novo</option><option value="qualificado">Qualificado</option><option value="negociando">Negociando</option><option value="matriculado">Matriculado</option><option value="perdido">Perdido</option></select></div><div class="tw"><div class="tth"><input class="si" style="max-width:300px" placeholder="Buscar lead..." oninput="searchLeads(this.value)"></div><table><thead><tr><th>#</th><th>Telefone</th><th>Nome</th><th>Estágio</th><th>Desde</th></tr></thead><tbody id="leads-tbody"><tr><td colspan="5"><div class="empty"><p>Carregando...</p></div></td></tr></tbody></table></div></div>
<div class="page" id="page-canais"><div class="page-hd"><div><div class="page-title">Canais WhatsApp</div><div class="page-sub" id="canais-sub">Sua conta Business conectada</div></div></div><div id="canais-container"><div class="empty"><p>Carregando informações da BM...</p></div></div></div>
<div class="page" id="page-config"><div class="page-hd"><div class="page-title">Configurações</div></div><div class="cfg-grid"><div class="cfg-nav"><div class="cfg-ni active" onclick="showCfg('perfil',this)">Meu Perfil</div><div class="cfg-ni" onclick="showCfg('senha',this)">Alterar Senha</div><div class="cfg-ni" id="cfg-ni-equipe" onclick="showCfg('equipe',this)">👥 Equipe</div><div class="cfg-ni" onclick="showCfg('sistema',this)">Sistema</div><div class="cfg-ni" onclick="doLogout()">Sair</div></div><div class="cfg-panel"><div id="cfg-perfil"><div class="cfg-ph"><div class="cfg-pt">Meu Perfil</div><div class="cfg-ps">Suas informações pessoais</div></div><div class="cfg-pb"><div class="cfg-sec"><div class="cfg-sec-t">Foto de perfil</div><div class="avatar-upload"><div class="avatar-big" id="cfg-avatar"><span id="cfg-av-init">T</span></div><div><button class="btn btn-g btn-sm" onclick="document.getElementById('avatar-inp').click()">Alterar foto</button><input type="file" id="avatar-inp" accept="image/*" style="display:none" onchange="handleAvatar(this)"><div style="font-size:11px;color:var(--t3);margin-top:6px">JPG ou PNG, máx 2MB</div></div></div></div><div class="cfg-sec"><div class="cfg-sec-t">Informações</div><div class="fg"><label class="fl-l">Nome completo</label><input class="fi" id="cfg-name"></div><div class="fg"><label class="fl-l">E-mail</label><input class="fi" id="cfg-email" type="email" readonly style="opacity:.6"></div>
<div class="fg"><label class="fl-l">Cargo</label><input class="fi" id="cfg-role-inp"></div><button class="btn btn-p btn-sm" onclick="savePerfil()">Salvar alterações</button></div></div></div><div id="cfg-senha" style="display:none"><div class="cfg-ph"><div class="cfg-pt">Alterar Senha</div></div><div class="cfg-pb"><div class="fg"><label class="fl-l">Senha atual</label><input class="fi" type="password" id="s-atual"></div><div class="fg"><label class="fl-l">Nova senha</label><input class="fi" type="password" id="s-nova"></div><div class="fg"><label class="fl-l">Confirmar nova senha</label><input class="fi" type="password" id="s-conf"></div><div class="login-err" id="s-err" style="margin-bottom:14px">As senhas não coincidem</div><button class="btn btn-p btn-sm" onclick="alterarSenha()">Alterar senha</button></div></div><div id="cfg-equipe" style="display:none"><div class="cfg-ph" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><div class="cfg-pt">👥 Equipe</div><div class="cfg-ps" id="equipe-sub">Gerencie quem tem acesso ao CRM</div></div><button class="btn btn-p btn-sm" onclick="openNewUser()">+ Adicionar Usuário</button></div><div class="cfg-pb" id="equipe-list"><div class="empty"><p>Carregando equipe...</p></div></div></div><div id="cfg-sistema" style="display:none"><div class="cfg-ph"><div class="cfg-pt">Sistema</div></div><div class="cfg-pb"><div class="cfg-sec"><div class="cfg-sec-t">Backend</div><div class="fg"><label class="fl-l">URL do servidor</label><input class="fi fmono" value="clara-instructiva-production.up.railway.app" readonly></div><div class="fg"><label class="fl-l">Supabase URL</label><input class="fi fmono" value="https://xqdlvtjvvgbpaxprnorn.supabase.co" readonly></div></div><div class="cfg-sec"><div class="cfg-sec-t">Status dos serviços</div><div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;font-size:13px;padding:10px;background:var(--bg);border-radius:8px"><span style="color:var(--t2);font-weight:500">Backend (Railway)</span><span style="color:var(--gr);font-weight:600">✓ Online</span></div><div style="display:flex;justify-content:space-between;font-size:13px;padding:10px;background:var(--bg);border-radius:8px"><span style="color:var(--t2);font-weight:500">Supabase</span><span style="color:var(--gr);font-weight:600" id="sys-db">Verificando...</span></div><div style="display:flex;justify-content:space-between;font-size:13px;padding:10px;background:var(--bg);border-radius:8px"><span style="color:var(--t2);font-weight:500">IA (Gemini)</span><span style="color:var(--gr);font-weight:600">✓ Ativa</span></div><div style="display:flex;justify-content:space-between;font-size:13px;padding:10px;background:var(--bg);border-radius:8px"><span style="color:var(--t2);font-weight:500">WhatsApp API</span><span style="color:var(--gr);font-weight:600">✓ Ativo</span></div></div></div></div></div></div></div>
</div></main></div>
<div class="mbg" id="m-gasto" onclick="if(event.target===this)closeModal('m-gasto')"><div class="modal sm"><div class="mt">Adicionar Gasto</div><div class="ms">Registre um novo investimento da operação</div><div class="fg"><label class="fl-l">Canal</label><select class="fsel" id="g-canal"><option value="">Selecione...</option><option value="Gemini">🤖 Gemini (IA)</option><option value="Meta">📱 Meta / WhatsApp</option><option value="Railway">🚂 Railway (servidor)</option><option value="Supabase">💾 Supabase (banco)</option><option value="Vercel">▲ Vercel (frontend)</option><option value="Trafego">📈 Tráfego pago</option><option value="Equipe">👥 Equipe / Salários</option><option value="Outros">➕ Outros</option></select></div><div class="fr2"><div class="fg"><label class="fl-l">Valor (R$)</label><input class="fi" type="number" step="0.01" id="g-valor" placeholder="0,00"></div><div class="fg"><label class="fl-l">Data</label><input class="fi" type="date" id="g-data"></div></div><div class="fg"><label class="fl-l">Descrição (opcional)</label><input class="fi" id="g-desc" placeholder="Ex: Mensalidade Railway novembro"></div><div class="macts"><button class="btn btn-g" onclick="closeModal('m-gasto')">Cancelar</button><button class="btn btn-p" onclick="salvarGasto()">Salvar Gasto</button></div></div></div>

<div class="mbg" id="m-venda" onclick="if(event.target===this)closeModal('m-venda')"><div class="modal"><div class="mt">Registrar Venda</div><div class="ms">Cadastre uma nova matrícula</div><div class="fg"><label class="fl-l">Vincular a um lead existente?</label><select class="fsel" id="v-lead"><option value="">Não vincular (venda solta)</option></select></div><div class="fr2"><div class="fg"><label class="fl-l">Nome do cliente</label><input class="fi" id="v-nome"></div><div class="fg"><label class="fl-l">Telefone</label><input class="fi" id="v-tel"></div></div><div class="fr2"><div class="fg"><label class="fl-l">Curso</label><input class="fi" id="v-curso"></div><div class="fg"><label class="fl-l">Valor (R$)</label><input class="fi" type="number" step="0.01" id="v-valor"></div></div><div class="fg"><label class="fl-l">Data da venda</label><input class="fi" type="date" id="v-data"></div><div class="fg"><label class="fl-l">Observações (opcional)</label><textarea class="fta" id="v-obs"></textarea></div><div class="macts"><button class="btn btn-g" onclick="closeModal('m-venda')">Cancelar</button><button class="btn btn-p" onclick="salvarVenda()">Registrar Venda</button></div></div></div>

<div class="mbg" id="m-template" onclick="if(event.target===this)closeModal('m-template')"><div class="modal lg"><div class="mt">Criar Template de Mensagem</div><div class="ms">Submeta um template à Meta para aprovação</div><div class="sec-div">Identificação</div><div class="fg"><label class="fl-l">Nome do template</label><input class="fi fmono" id="t-name" placeholder="boas_vindas_lead" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'_')"></div><div class="fr2"><div class="fg"><label class="fl-l">Categoria</label><select class="fsel" id="t-category"><option value="MARKETING">📣 Marketing</option><option value="UTILITY">🔔 Utilidade</option><option value="AUTHENTICATION">🔒 Autenticação</option></select></div><div class="fg"><label class="fl-l">Idioma</label><select class="fsel" id="t-language"><option value="pt_BR">Português (BR)</option><option value="en_US">English (US)</option><option value="es_ES">Español (ES)</option></select></div></div><div class="sec-div">Conteúdo</div><div class="fg"><label class="fl-l">Cabeçalho (opcional)</label><input class="fi" id="t-header"></div><div class="fg"><label class="fl-l">Corpo da mensagem *</label><textarea class="fta" id="t-body" style="min-height:120px"></textarea><div style="font-size:11px;color:var(--t3);margin-top:6px">Use {{1}}, {{2}} para variáveis</div></div><div class="fg"><label class="fl-l">Rodapé (opcional)</label><input class="fi" id="t-footer"></div><div class="macts"><button class="btn btn-g" onclick="closeModal('m-template')">Cancelar</button><button class="btn btn-p" onclick="submitTemplate()" id="btn-submit-t">Submeter à Meta</button></div></div></div>

<div class="mbg" id="m-camp" onclick="if(event.target===this)closeModal('m-camp')"><div class="modal lg"><div class="mt" id="camp-step-title">Nova Campanha — Passo 1 de 4</div><div class="ms" id="camp-step-sub">Identifique a campanha</div><div id="camp-s1"><div class="fg"><label class="fl-l">Nome da campanha</label><input class="fi" id="c-nome"></div><div class="fg"><label class="fl-l">Descrição (opcional)</label><textarea class="fta" id="c-desc"></textarea></div></div><div id="camp-s2" style="display:none"><div class="fg"><label class="fl-l">Escolha o template aprovado</label><select class="fsel" id="c-template" onchange="updateTemplatePreview()"><option value="">Carregando templates...</option></select></div><div id="c-template-preview" style="display:none;background:var(--bg);border:1px solid var(--b1);border-radius:9px;padding:12px;font-size:13px;color:var(--t2);line-height:1.55;white-space:pre-wrap;margin-top:10px"></div><div id="c-vars-info" style="display:none;background:var(--ywl);border:1px solid var(--ywb);border-radius:9px;padding:11px 14px;font-size:12px;color:var(--t2);margin-top:10px;font-weight:500;line-height:1.5">⚠️ Esse template usa variáveis (<strong id="c-vars-count">0</strong>). A primeira variável <strong>{{1}}</strong> sempre será o nome do lead.</div></div><div id="camp-s3" style="display:none"><div class="fg"><label class="fl-l">Qual agente conduz essa campanha quando lead responder?</label><select class="fsel" id="c-agente"><option value="">Carregando agentes...</option></select></div></div><div id="camp-s4" style="display:none"><div class="fg"><label class="fl-l">Importe os leads (CSV)</label><div class="drop-zone" id="csv-drop" onclick="document.getElementById('csv-file').click()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><h4>Arraste o CSV aqui ou clique para selecionar</h4><p>Formato: nome, telefone (1 por linha)</p></div><input type="file" id="csv-file" accept=".csv,.txt" style="display:none" onchange="handleCSV(this.files[0])"></div><div id="csv-preview" style="display:none"><div style="font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px"><span id="csv-count">0</span> leads importados</div><div class="csv-preview" id="csv-preview-body"></div></div><div style="margin-top:12px;text-align:center"><button class="btn btn-g btn-xs" onclick="usarLeadsExistentes()">Usar leads do CRM</button> <button class="btn btn-g btn-xs" onclick="colarLeads()">Colar lista manualmente</button></div></div><div class="macts"><button class="btn btn-g" onclick="closeModal('m-camp')">Cancelar</button><button class="btn btn-g" id="camp-btn-back" onclick="campStep(-1)" style="display:none">← Voltar</button><button class="btn btn-p" id="camp-btn-next" onclick="campStep(1)">Próximo →</button></div></div></div>

<div class="mbg" id="m-camp-detail" onclick="if(event.target===this)closeModal('m-camp-detail')"><div class="modal lg"><div id="camp-detail-body"></div></div></div>

<div class="mbg" id="m-user" onclick="if(event.target===this)closeModal('m-user')">
  <div class="modal">
    <div class="mt" id="m-user-title">+ Adicionar Usuário</div>
    <div class="ms">Crie um acesso pra alguém da sua equipe</div>
    <div class="fr2"><div class="fg"><label class="fl-l">Nome completo</label><input class="fi" id="u-nome" placeholder="João da Silva"></div><div class="fg"><label class="fl-l">Cargo</label><input class="fi" id="u-cargo" placeholder="Diretor de vendas"></div></div>
    <div class="fg"><label class="fl-l">E-mail (será o login)</label><input class="fi" id="u-email" type="email" placeholder="joao@instructiva.com"></div>
    <div class="fg"><label class="fl-l">Senha</label><input class="fi" id="u-senha" type="text" placeholder="Mínimo 6 caracteres"></div>
    <div class="fg"><label class="fl-l">Permissão</label>
      <div class="role-cards">
        <div class="role-card" data-role="admin" onclick="selectRole('admin')"><div class="role-card-icon">👑</div><div class="role-card-name">Administrador</div><div class="role-card-desc">Faz tudo, inclusive gerenciar equipe</div></div>
        <div class="role-card selected" data-role="operador" onclick="selectRole('operador')"><div class="role-card-icon">🎯</div><div class="role-card-name">Operador</div><div class="role-card-desc">Acompanha + assume conversas</div></div>
        <div class="role-card" data-role="observador" onclick="selectRole('observador')"><div class="role-card-icon">👁️</div><div class="role-card-name">Observador</div><div class="role-card-desc">Apenas visualiza, não modifica</div></div>
      </div>
    </div>
    <div class="macts"><button class="btn btn-g" onclick="closeModal('m-user')">Cancelar</button><button class="btn btn-p" onclick="saveUser()" id="btn-save-user">Criar Usuário</button></div>
  </div>
</div>

<div class="mbg" id="m-agente" onclick="if(event.target===this)closeModal('m-agente')">
  <div class="modal lg">
    <div class="mt" id="m-agente-title">Criar Agente</div>
    <div class="ms">Treine sua Clara com profundidade — preencha cada aba ou anexe documentos</div>
    <div class="ag-modal-tabs">
      <button class="ag-modal-tab active" onclick="setAgTab('identidade')" id="agtab-identidade">📋 Identidade</button>
      <button class="ag-modal-tab" onclick="setAgTab('persona')" id="agtab-persona">🧠 Persona</button>
      <button class="ag-modal-tab" onclick="setAgTab('cursos')" id="agtab-cursos">📚 Cursos</button>
      <button class="ag-modal-tab" onclick="setAgTab('objecoes')" id="agtab-objecoes">💬 Objeções</button>
      <button class="ag-modal-tab" onclick="setAgTab('playbook')" id="agtab-playbook">🎯 Playbook</button>
      <button class="ag-modal-tab" onclick="setAgTab('faq')" id="agtab-faq">❓ FAQ</button>
      <button class="ag-modal-tab" onclick="setAgTab('escalacao')" id="agtab-escalacao">🚨 Escalação</button>
    </div>
    <div class="ag-pane active" id="agpane-identidade">
      <div class="ag-pane-hint">📋 Identifique esse agente. Use nomes específicos pra cada lançamento.</div>
      <div class="fr2"><div class="fg"><label class="fl-l">Nome do agente</label><input class="fi" id="ag-nome" placeholder="Ex: Clara — Inverter Lançamento Maio"></div><div class="fg"><label class="fl-l">Tom de voz</label><select class="fsel" id="ag-tom"><option value="amigavel">Amigável e próximo</option><option value="profissional">Profissional e direto</option><option value="consultivo">Especialista e consultivo</option><option value="energetico">Energético e motivador</option></select></div></div>
      <div class="fg"><label class="fl-l">Objetivo principal</label><input class="fi" id="ag-objetivo" placeholder="Ex: Conduzir o lead até a matrícula no curso de Reparo de Inverter"></div>
      <div class="fg" style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--b1);border-radius:9px;padding:12px 14px"><input type="checkbox" id="ag-default" style="width:auto;margin:0"><label for="ag-default" style="font-size:13px;color:var(--t1);font-weight:500;cursor:pointer;flex:1">Usar como agente padrão<div style="font-size:11px;color:var(--t3);margin-top:2px;font-weight:500">Quando o lead manda mensagem orgânica (sem campanha), esse agente assume</div></label></div>
    </div>
    <div class="ag-pane" id="agpane-persona">
      <div class="ag-pane-hint">🧠 Define quem é a Clara. Quanto mais específico, mais natural ela soa.</div>
      <div class="fg"><label class="fl-l">Quem ela é</label><textarea class="fta" id="ag-quem" placeholder="Ex: Você é a Clara, consultora de vendas da Escola Instructiva..." style="min-height:80px"></textarea></div>
      <div class="fg"><label class="fl-l">Como escreve</label><textarea class="fta" id="ag-escreve" placeholder="Ex: Mensagens curtas, máx 3 linhas. Usa 'você'." style="min-height:70px"></textarea></div>
      <div class="ag-section-title">Comportamento</div>
      <div class="fr2"><div class="fg"><label class="fl-l">SEMPRE faz</label><textarea class="fta" id="ag-sempre" placeholder="- Pergunta o nome no começo&#10;- Confirma o que entendeu antes de dar preço" style="min-height:120px"></textarea></div><div class="fg"><label class="fl-l">NUNCA faz</label><textarea class="fta" id="ag-nunca" placeholder="- Inventa CPF, e-mail ou cadastro&#10;- Promete coisas que não pode entregar" style="min-height:120px"></textarea></div></div>
    </div>
    <div class="ag-pane" id="agpane-cursos">
      <div class="ag-pane-hint">📚 Anexe materiais sobre o curso (ementa, página de venda em PDF) ou cadastre manualmente.</div>
      <div class="ag-section-title">Anexar documentos do curso</div>
      <div class="ag-upload" onclick="document.getElementById('file-cursos').click()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><h5>Anexar PDF, DOC ou TXT</h5><p>Clique para selecionar (múltiplos arquivos OK)</p></div>
      <input type="file" id="file-cursos" accept=".pdf,.doc,.docx,.txt" multiple style="display:none" onchange="handleAgFile(event,'cursos')">
      <div class="ag-files" id="files-cursos"></div>
      <div class="ag-or-divider">ou cadastre manualmente</div>
      <div id="lista-cursos"></div>
      <button class="ag-list-add" onclick="addCurso()">＋ Adicionar Curso</button>
    </div>
    <div class="ag-pane" id="agpane-objecoes">
      <div class="ag-pane-hint">💬 Anexe um documento com TODAS as objeções ou cadastre uma a uma.</div>
      <div class="ag-section-title">Anexar documento de objeções</div>
      <div class="ag-upload" onclick="document.getElementById('file-objecoes').click()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><h5>Anexar PDF, DOC ou TXT</h5><p>Clique para selecionar</p></div>
      <input type="file" id="file-objecoes" accept=".pdf,.doc,.docx,.txt" multiple style="display:none" onchange="handleAgFile(event,'objecoes')">
      <div class="ag-files" id="files-objecoes"></div>
      <div class="ag-or-divider">ou adicione manualmente</div>
      <div id="lista-objecoes"></div>
      <button class="ag-list-add" onclick="addObjecao()">＋ Adicionar Objeção</button>
    </div>
    <div class="ag-pane" id="agpane-playbook">
      <div class="ag-pane-hint">🎯 Como conduzir a venda do começo ao fim.</div>
      <div class="ag-section-title">Anexar script de venda</div>
      <div class="ag-upload" onclick="document.getElementById('file-playbook').click()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><h5>Anexar PDF, DOC ou TXT</h5><p>Clique para selecionar</p></div>
      <input type="file" id="file-playbook" accept=".pdf,.doc,.docx,.txt" multiple style="display:none" onchange="handleAgFile(event,'playbook')">
      <div class="ag-files" id="files-playbook"></div>
      <div class="ag-or-divider">ou preencha as etapas</div>
      <div class="fg"><label class="fl-l">1. Primeira mensagem (abertura)</label><textarea class="fta" id="ag-pb-abertura"></textarea></div>
      <div class="fg"><label class="fl-l">2. Qualificação (perguntas-chave)</label><textarea class="fta" id="ag-pb-qualif"></textarea></div>
      <div class="fg"><label class="fl-l">3. Apresentação do curso</label><textarea class="fta" id="ag-pb-apres"></textarea></div>
      <div class="fg"><label class="fl-l">4. Quando soltar o preço</label><textarea class="fta" id="ag-pb-preco"></textarea></div>
      <div class="fg"><label class="fl-l">5. Fechamento</label><textarea class="fta" id="ag-pb-fech"></textarea></div>
      <div class="fg"><label class="fl-l">6. Recuperação (se ele sumir)</label><textarea class="fta" id="ag-pb-recup"></textarea></div>
    </div>
    <div class="ag-pane" id="agpane-faq">
      <div class="ag-pane-hint">❓ Perguntas frequentes que aparecem sempre.</div>
      <div class="ag-section-title">Anexar documento de FAQ</div>
      <div class="ag-upload" onclick="document.getElementById('file-faq').click()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><h5>Anexar PDF, DOC ou TXT</h5><p>Clique para selecionar</p></div>
      <input type="file" id="file-faq" accept=".pdf,.doc,.docx,.txt" multiple style="display:none" onchange="handleAgFile(event,'faq')">
      <div class="ag-files" id="files-faq"></div>
      <div class="ag-or-divider">ou adicione manualmente</div>
      <div id="lista-faq"></div>
      <button class="ag-list-add" onclick="addFaq()">＋ Adicionar Pergunta</button>
    </div>
    <div class="ag-pane" id="agpane-escalacao">
      <div class="ag-pane-hint">🚨 Quando a Clara deve passar pra humano ou encerrar atendimento.</div>
      <div class="fg"><label class="fl-l">Quando passar pra humano</label><textarea class="fta" id="ag-esc-quando" style="min-height:130px"></textarea></div>
      <div class="fg"><label class="fl-l">Como passar (frase padrão)</label><textarea class="fta" id="ag-esc-frase" style="min-height:80px"></textarea></div>
      <div class="fr2"><div class="fg"><label class="fl-l">Nome do humano</label><input class="fi" id="ag-esc-nome"></div><div class="fg"><label class="fl-l">Telefone/WhatsApp</label><input class="fi" id="ag-esc-tel"></div></div>
      <div class="ag-section-title">Quando encerrar atendimento</div>
      <div class="fg"><label class="fl-l">Critérios de encerramento</label><textarea class="fta" id="ag-esc-encerrar" style="min-height:100px"></textarea></div>
    </div>
    <div class="macts"><button class="btn btn-g" onclick="closeModal('m-agente')">Cancelar</button><button class="btn btn-p" onclick="saveAgente()" id="btn-save-agente">Salvar Agente</button></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>window.pdfjsLib&&(pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
<script>
const SUPA_URL='https://xqdlvtjvvgbpaxprnorn.supabase.co';
const SUPA_KEY='sb_publishable_vhGzY7v93kTZ32_CFj4lVA_M6S7WUWA';
const BACKEND_URL='https://clara-instructiva-production.up.railway.app';

let currentUser=null,allLeads=[],allConvs=[],allGastos=[],allVendas=[],convTab='all',agents=[],editingId=null,currentPeriod='hoje',customStart=null,customEnd=null,inboxPollInterval=null,openConvId=null;

function getUsers(){return JSON.parse(localStorage.getItem('clara-users')||'[]')}
function saveUsers(u){localStorage.setItem('clara-users',JSON.stringify(u))}

// ============= SISTEMA DE PERMISSÕES =============
const PERMISSIONS={
  admin:{canEditAgents:true,canManageCampaigns:true,canManageTemplates:true,canRegisterSale:true,canPauseAI:true,canSendManual:true,canManageUsers:true,canManageGastos:true,canConfig:true},
  operador:{canEditAgents:false,canManageCampaigns:false,canManageTemplates:false,canRegisterSale:true,canPauseAI:true,canSendManual:true,canManageUsers:false,canManageGastos:false,canConfig:false},
  observador:{canEditAgents:false,canManageCampaigns:false,canManageTemplates:false,canRegisterSale:false,canPauseAI:false,canSendManual:false,canManageUsers:false,canManageGastos:false,canConfig:false}
};
function userRole(){return currentUser?.role||'observador'}
function can(perm){return PERMISSIONS[userRole()]?.[perm]||false}
const ROLE_LABELS={admin:'👑 Admin',operador:'🎯 Operador',observador:'👁️ Observador'};

// ============= AUTENTICAÇÃO via SUPABASE =============
async function doLogin(){
  const email=document.getElementById('l-email').value.trim().toLowerCase();
  const pass=document.getElementById('l-pass').value;
  if(!email||!pass){document.getElementById('login-err').textContent='Preencha email e senha';document.getElementById('login-err').style.display='block';return}
  const users=await supa(`usuarios?email=eq.${encodeURIComponent(email)}&senha=eq.${encodeURIComponent(pass)}&ativo=eq.true&select=*`);
  if(!users||!users.length){document.getElementById('login-err').textContent='E-mail ou senha incorretos';document.getElementById('login-err').style.display='block';return}
  document.getElementById('login-err').style.display='none';
  const u=users[0];
  currentUser={id:u.id,name:u.nome,email:u.email,role:u.role,cargo:u.cargo,avatar:u.avatar};
  localStorage.setItem('clara-session',JSON.stringify(currentUser));
  launchApp(currentUser);
}
function doLogout(){localStorage.removeItem('clara-session');currentUser=null;document.getElementById('app').classList.remove('show');document.getElementById('login-screen').style.display='flex'}
function launchApp(user){document.getElementById('login-screen').style.display='none';document.getElementById('app').classList.add('show');updateUserUI(user);applyPermissions();setGreeting();loadHome()}
function applyPermissions(){
  // Esconde aba Equipe pra quem não é admin
  const equipeTab=document.getElementById('cfg-ni-equipe');
  if(equipeTab)equipeTab.style.display=can('canManageUsers')?'flex':'none';
  // Aplica disabled em botões de ação que requerem permissão
  setTimeout(()=>{
    const map=[
      {sel:'[onclick*="openNewAgent"]',perm:'canEditAgents'},
      {sel:'[onclick^="editAgente"]',perm:'canEditAgents'},
      {sel:'[onclick^="deleteAgente"]',perm:'canEditAgents'},
      {sel:'[onclick*="openNewCampanha"]',perm:'canManageCampaigns'},
      {sel:'[onclick^="dispararCampanha"]',perm:'canManageCampaigns'},
      {sel:'[onclick^="deleteCampanha"]',perm:'canManageCampaigns'},
      {sel:'[onclick*="openNewTemplate"]',perm:'canManageTemplates'},
      {sel:'[onclick^="deleteTemplate"]',perm:'canManageTemplates'},
      {sel:'[onclick*="m-gasto"]',perm:'canManageGastos'},
      {sel:'[onclick*="m-venda"]',perm:'canRegisterSale'},
      {sel:'[onclick^="registrarVendaConv"]',perm:'canRegisterSale'},
      {sel:'[onclick^="pausarClara"]',perm:'canPauseAI'},
      {sel:'[onclick^="retomarClara"]',perm:'canPauseAI'},
      {sel:'[onclick^="enviarMensagemManual"]',perm:'canSendManual'}
    ];
    map.forEach(({sel,perm})=>{
      if(can(perm))return;
      document.querySelectorAll(sel).forEach(el=>{
        el.classList.add('no-perm');
        el.title='Sem permissão — fale com o admin';
      });
    });
  },300);
}
function updateUserUI(user){const initials=nameInitials(user.name);const gradient=nameToGradient(user.name);document.getElementById('sidebar-name').textContent=user.name.split(' ')[0];document.getElementById('sidebar-role').textContent=user.cargo||ROLE_LABELS[user.role]||'Usuário';document.getElementById('sidebar-initials').textContent=initials;document.getElementById('cfg-av-init').textContent=initials;document.getElementById('welcome-name').textContent=user.name.split(' ')[0]+'.';document.getElementById('cfg-name').value=user.name;document.getElementById('cfg-email').value=user.email;document.getElementById('cfg-role-inp').value=user.cargo||'';const sbAv=document.getElementById('sidebar-av');const cfgAv=document.getElementById('cfg-avatar');if(user.avatar){sbAv.innerHTML=`<img src="${user.avatar}">`;cfgAv.innerHTML=`<img src="${user.avatar}">`}else{sbAv.style.background=gradient;cfgAv.style.background=gradient}}
function setGreeting(){const h=new Date().getHours();let g='Boa noite,';if(h>=5&&h<12)g='Bom dia,';else if(h>=12&&h<18)g='Boa tarde,';document.getElementById('greeting').textContent=g}
(()=>{const t=localStorage.getItem('clara-theme')||'dark';document.documentElement.setAttribute('data-theme',t)})();
function toggleTheme(){const cur=document.documentElement.getAttribute('data-theme');const next=cur==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',next);localStorage.setItem('clara-theme',next)}
function go(page,el){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));document.getElementById('page-'+page).classList.add('active');if(el)el.classList.add('active');const T={home:'Início',dashboard:'Dashboard',inbox:'Caixa de Entrada',agentes:'Agentes',disparo:'Disparador',campanhas:'Campanhas',templates:'Templates',leads:'Leads',canais:'Canais',config:'Configurações'};document.getElementById('page-title').textContent=T[page]||page;if(page==='home')loadHome();if(page==='dashboard')loadDashboard();if(page==='inbox'){loadInbox();startInboxPolling()}else{stopInboxPolling()}if(page==='agentes')renderAgents();if(page==='campanhas')loadCampanhas();if(page==='templates')loadTemplates();if(page==='leads')loadLeads();if(page==='canais')loadCanalStats();if(page==='config')checkSys();setTimeout(applyPermissions,400)}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
function openModal(id){document.getElementById(id).classList.add('open');if(id==='m-gasto'){document.getElementById('g-data').value=new Date().toISOString().split('T')[0];document.getElementById('g-canal').value='';document.getElementById('g-valor').value='';document.getElementById('g-desc').value=''}if(id==='m-venda'){document.getElementById('v-data').value=new Date().toISOString().split('T')[0];['v-nome','v-tel','v-curso','v-valor','v-obs','v-lead'].forEach(x=>{const e=document.getElementById(x);if(e)e.value=''});populateLeadsSelect()}}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return'agora';if(s<3600)return Math.floor(s/60)+'min';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d'}
function fmtPhone(p){if(!p)return'—';const s=String(p).replace(/\D/g,'');if(s.length>=12)return`+${s.slice(0,2)} (${s.slice(2,4)}) ${s.slice(4,9)}-${s.slice(9,13)}`;return'+'+s}
function fmtBRL(v){return 'R$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
const AVATAR_PALETTES=[['#FF6B1A','#FF8C42'],['#3B82F6','#8B5CF6'],['#10B981','#34D399'],['#EC4899','#F472B6'],['#F59E0B','#FBBF24'],['#06B6D4','#0EA5E9'],['#8B5CF6','#A78BFA'],['#EF4444','#F87171'],['#14B8A6','#5EEAD4'],['#6366F1','#818CF8'],['#F97316','#FB923C'],['#84CC16','#A3E635']];
function nameToGradient(name){if(!name)name='?';let h=0;for(let i=0;i<name.length;i++)h=((h<<5)-h)+name.charCodeAt(i)|0;const idx=Math.abs(h)%AVATAR_PALETTES.length;const[c1,c2]=AVATAR_PALETTES[idx];return`linear-gradient(135deg,${c1} 0%,${c2} 100%)`}
function nameInitials(name){if(!name)return'?';const parts=name.trim().split(/\s+/);if(parts.length>=2)return(parts[0][0]+parts[parts.length-1][0]).toUpperCase();return name.slice(0,2).toUpperCase()}
async function supa(path,opts={}){try{const r=await fetch(`${SUPA_URL}/rest/v1/${path}`,{...opts,headers:{'apikey':SUPA_KEY,'Authorization':`Bearer ${SUPA_KEY}`,'Content-Type':'application/json',...(opts.headers||{})}});return r.ok?(r.status===204?true:r.json()):null}catch{return null}}
async function supaInsert(table,data){return supa(table,{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(data)})}
async function supaUpdate(table,id,data){return supa(`${table}?id=eq.${id}`,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(data)})}
async function supaDelete(table,id){return supa(`${table}?id=eq.${id}`,{method:'DELETE'})}
async function backend(path,opts={}){try{const r=await fetch(`${BACKEND_URL}${path}`,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});const data=await r.json().catch(()=>null);return{ok:r.ok,status:r.status,data}}catch(e){return{ok:false,error:e.message}}}
function getPeriodRange(){const now=new Date();let start,end;if(currentPeriod==='hoje'){start=new Date(now.getFullYear(),now.getMonth(),now.getDate());end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)}else if(currentPeriod==='semana'){const d=now.getDay();start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-d);end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+(7-d))}else if(currentPeriod==='mes'){start=new Date(now.getFullYear(),now.getMonth(),1);end=new Date(now.getFullYear(),now.getMonth()+1,1)}else if(currentPeriod==='30dias'){start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-30);end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)}else if(currentPeriod==='custom'&&customStart&&customEnd){start=new Date(customStart);end=new Date(customEnd);end.setDate(end.getDate()+1)}else{start=new Date(0);end=new Date(now.getFullYear()+1,0,1)}return{start,end}}
function getPeriodLabel(){if(currentPeriod==='custom'&&customStart&&customEnd)return`De ${new Date(customStart).toLocaleDateString('pt-BR')} a ${new Date(customEnd).toLocaleDateString('pt-BR')}`;return{hoje:'Hoje',semana:'Esta semana',mes:'Este mês','30dias':'Últimos 30 dias'}[currentPeriod]||'Todos'}
function setPeriod(p,el){currentPeriod=p;customStart=null;customEnd=null;document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');document.getElementById('period-start').value='';document.getElementById('period-end').value='';loadDashboard()}
function setPeriodCustom(){const s=document.getElementById('period-start').value;const e=document.getElementById('period-end').value;if(s&&e){currentPeriod='custom';customStart=s;customEnd=e;document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));loadDashboard()}}
async function loadHome(){const[leads,convs]=await Promise.all([supa('leads?select=id,stage,created_at,phone,name&order=created_at.desc'),supa('conversas?select=id,status')]);allLeads=leads||[];if(leads){const el1=document.getElementById('hm-leads');if(el1)el1.textContent=leads.length}if(convs){const ab=convs.filter(c=>c.status==='aberta').length;const el2=document.getElementById('hm-conv');if(el2)el2.textContent=ab;document.getElementById('inbox-badge').textContent=convs.length}}
async function loadDashboard(){document.getElementById('dash-period-label').textContent=getPeriodLabel();const[gastos,vendas,leads,msgs]=await Promise.all([supa('gastos?select=*&order=data.desc'),supa('vendas?select=*&order=data.desc'),supa('leads?select=id,stage,created_at,phone,name'),supa('mensagens?select=id,created_at,role,content,lead_id&order=created_at.desc&limit=20')]);allGastos=gastos||[];allVendas=vendas||[];allLeads=leads||allLeads;const{start,end}=getPeriodRange();const inRange=d=>{const dt=new Date(d);return dt>=start&&dt<end};const gastosP=allGastos.filter(g=>inRange(g.data));const vendasP=allVendas.filter(v=>inRange(v.data));const leadsP=(leads||[]).filter(l=>inRange(l.created_at));const totalInvest=gastosP.reduce((s,g)=>s+Number(g.valor),0);const totalBruto=vendasP.reduce((s,v)=>s+Number(v.valor),0);const totalLiquido=totalBruto-totalInvest;const roi=totalInvest>0?((totalBruto-totalInvest)/totalInvest)*100:0;document.getElementById('k-invest').textContent=fmtBRL(totalInvest);document.getElementById('k-invest-sub').textContent=gastosP.length+' transações';document.getElementById('k-bruto').textContent=fmtBRL(totalBruto);document.getElementById('k-bruto-vendas').textContent=vendasP.length;document.getElementById('k-liquido').textContent=fmtBRL(totalLiquido);document.getElementById('k-liquido').style.color=totalLiquido>=0?'var(--gr)':'var(--rd)';document.getElementById('k-roi').textContent=totalInvest>0?roi.toFixed(0)+'%':'—';document.getElementById('k-roi').style.color=roi>=0?'var(--gr)':'var(--rd)';document.getElementById('k-roi-sub').textContent=totalInvest>0?(roi>=0?'positivo':'negativo'):'sem investimento';const canais={};gastosP.forEach(g=>{canais[g.canal]=(canais[g.canal]||0)+Number(g.valor)});const canalIcons={Gemini:'🤖',Meta:'📱',Railway:'🚂',Supabase:'💾',Vercel:'▲',Trafego:'📈',Equipe:'👥',Outros:'➕'};const sortedCanais=Object.entries(canais).sort((a,b)=>b[1]-a[1]);document.getElementById('invest-list').innerHTML=sortedCanais.length?sortedCanais.map(([c,v])=>{const pct=totalInvest>0?((v/totalInvest)*100).toFixed(0):0;return`<div class="invest-item"><div class="invest-ic" style="background:var(--s2)">${canalIcons[c]||'💸'}</div><div class="invest-info"><div class="invest-nm">${c}</div><div class="invest-ds">${gastosP.filter(g=>g.canal===c).length} transação(ões)</div></div><div class="invest-vl">${fmtBRL(v)}</div><div class="invest-pct">${pct}%</div></div>`}).join(''):'<div class="empty"><p>Nenhum gasto no período</p></div>';const stages=['novo','qualificado','negociando','matriculado','perdido'];const cnt={};stages.forEach(s=>cnt[s]=leadsP.filter(l=>(l.stage||'novo')===s).length);const mx=Math.max(...Object.values(cnt),1);document.getElementById('funnel-list').innerHTML=stages.map(s=>`<div class="fb"><span class="fn">${s}</span><div class="ft"><div class="ff" style="width:${(cnt[s]/mx)*100}%"></div></div><span class="fv">${cnt[s]}</span></div>`).join('');if(msgs){const msgsP=msgs.filter(m=>inRange(m.created_at)).slice(0,8);document.getElementById('feed-list').innerHTML=msgsP.length?msgsP.map(m=>`<div class="fi-row"><div class="fav" style="background:${m.role==='user'?'var(--bll)':'var(--brl)'}">${m.role==='user'?'👤':'🤖'}</div><div class="fb2"><div class="flbl">${m.role==='user'?'Lead':'Clara'}: ${(m.content||'').slice(0,55)}${(m.content||'').length>55?'...':''}</div><div class="ft2">${timeAgo(m.created_at)}</div></div></div>`).join(''):'<div class="empty"><p>Sem atividade</p></div>'}}
function toggleInvestDetail(){document.getElementById('invest-detail').classList.toggle('open')}
async function salvarGasto(){const canal=document.getElementById('g-canal').value;const valor=parseFloat(document.getElementById('g-valor').value);const data=document.getElementById('g-data').value;const desc=document.getElementById('g-desc').value;if(!canal||!valor||!data){showToast('Preencha canal, valor e data');return}const r=await supaInsert('gastos',{canal,valor,data,descricao:desc||null});if(r){showToast('✓ Gasto registrado');closeModal('m-gasto');loadDashboard()}else showToast('Erro ao salvar')}
function populateLeadsSelect(){const sel=document.getElementById('v-lead');sel.innerHTML='<option value="">Não vincular (venda solta)</option>';allLeads.forEach(l=>{const label=l.name?`${l.name} - ${fmtPhone(l.phone)}`:fmtPhone(l.phone);sel.innerHTML+=`<option value="${l.id}">${label}</option>`})}
async function salvarVenda(){const lead_id=document.getElementById('v-lead').value||null;const nome=document.getElementById('v-nome').value;const tel=document.getElementById('v-tel').value;const curso=document.getElementById('v-curso').value;const valor=parseFloat(document.getElementById('v-valor').value);const data=document.getElementById('v-data').value;const obs=document.getElementById('v-obs').value;if(!valor||!data){showToast('Preencha valor e data');return}const venda={lead_id,cliente_nome:nome||null,cliente_telefone:tel||null,curso:curso||null,valor,data,observacoes:obs||null};const r=await supaInsert('vendas',venda);if(r){if(lead_id)await supaUpdate('leads',lead_id,{stage:'matriculado'});showToast('✓ Venda registrada');closeModal('m-venda');loadDashboard();loadHome()}else showToast('Erro ao salvar')}
async function loadInbox(silent=false){const convs=await supa('conversas?select=id,lead_id,status,ia_active,campanha_id,created_at,updated_at,leads(phone,name),campanhas(nome)&order=updated_at.desc&limit=40');if(!convs)return;const oldConvs=allConvs||[];allConvs=convs;document.getElementById('inbox-badge').textContent=convs.length;if(silent&&oldConvs.length){const oldMap=Object.fromEntries(oldConvs.map(c=>[c.id,c.updated_at]));const novidades=convs.filter(c=>!oldMap[c.id]||oldMap[c.id]!==c.updated_at);if(novidades.length){const novaConv=!oldMap[novidades[0].id];const phone=novidades[0].leads?.phone||novidades[0].lead_id;const name=novidades[0].leads?.name||fmtPhone(phone);showToast(`🔔 ${novaConv?'Nova conversa':'Nova mensagem'}: ${name}`)}}let list=allConvs;if(convTab==='open')list=await filterAwaitingReply(allConvs);renderConvList(list);if(silent&&openConvId){const conv=allConvs.find(c=>c.id===openConvId);if(conv)refreshOpenConv()}}
async function filterAwaitingReply(convs){if(!convs.length)return convs;const ids=convs.map(c=>`"${c.id}"`).join(',');const lastMsgs=await supa(`mensagens?select=conversa_id,role,created_at&conversa_id=in.(${ids})&order=created_at.desc&limit=200`);if(!lastMsgs)return convs;const lastByConv={};for(const m of lastMsgs){if(!lastByConv[m.conversa_id])lastByConv[m.conversa_id]=m.role}return convs.filter(c=>c.status==='aberta'&&lastByConv[c.id]==='user')}
async function refreshOpenConv(){if(!openConvId)return;const msgs=await supa(`mensagens?select=*&conversa_id=eq.${openConvId}&order=created_at.asc`);const ms=document.getElementById('ms');if(!ms||!msgs)return;const currentCount=ms.querySelectorAll('.mg').length;if(msgs.length>currentCount){ms.innerHTML=msgs.map(m=>`<div class="mg ${m.role}"><div class="bub ${m.role}">${(m.content||'').replace(/</g,'&lt;')}</div><div class="bt">${new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>`).join('');ms.scrollTop=99999}}
function startInboxPolling(){stopInboxPolling();inboxPollInterval=setInterval(()=>loadInbox(true),8000)}
function stopInboxPolling(){if(inboxPollInterval){clearInterval(inboxPollInterval);inboxPollInterval=null}}
async function setTab(t){convTab=t;['all','open'].forEach(x=>{const e=document.getElementById('it-'+x);if(e)e.classList.toggle('active',x===t)});let list=allConvs;if(t==='open')list=await filterAwaitingReply(allConvs);renderConvList(list)}
function renderConvList(list){if(!list.length){document.getElementById('conv-list').innerHTML='<div class="empty"><p>Nenhuma conversa</p></div>';return}const orangeGrad='linear-gradient(135deg,#FF6B1A 0%,#FF8C42 100%)';document.getElementById('conv-list').innerHTML=list.map(c=>{const phone=c.leads?.phone||c.lead_id;const name=c.leads?.name;const display=name||fmtPhone(phone);const initials=nameInitials(display);const paused=c.ia_active===false;const pausedClass=paused?' paused':'';const pausedBadge=paused?'<div class="ci-paused-badge">👤 Você assumiu</div>':'';const campNome=c.campanhas?.nome;const campBadge=campNome?`<div class="ci-camp-badge" title="Campanha: ${campNome}">${campNome.length>22?campNome.slice(0,22)+'…':campNome}</div>`:'';return`<div class="ci${pausedClass}" onclick="openConv('${c.id}',this)"><div class="cav" style="background:${orangeGrad}">${initials}</div><div class="cinfo"><div class="cnm">${display}</div><div class="cprev">${c.status} · ${timeAgo(c.updated_at||c.created_at)}</div>${campBadge}${pausedBadge}</div><div class="cmeta"><span class="ctime">${timeAgo(c.updated_at||c.created_at)}</span></div></div>`}).join('')}
function filterConvs(q){let list=allConvs;if(q)list=list.filter(c=>JSON.stringify(c).toLowerCase().includes(q.toLowerCase()));renderConvList(list)}
async function openConv(id,el){openConvId=id;document.querySelectorAll('.ci').forEach(i=>i.classList.remove('active'));el.classList.add('active');const msgs=await supa(`mensagens?select=*&conversa_id=eq.${id}&order=created_at.asc`);const conv=allConvs.find(c=>c.id===id);const phone=conv?.leads?.phone||conv?.lead_id;const name=conv?.leads?.name;const display=name||fmtPhone(phone);const initials=nameInitials(display);const gradient='linear-gradient(135deg,#FF6B1A 0%,#FF8C42 100%)';const paused=conv?.ia_active===false;const campNome=conv?.campanhas?.nome;const campTag=campNome?`<span class="chat-camp-tag" title="Campanha ativa">${campNome}</span>`:'';const area=document.getElementById('chat-area');if(!msgs?.length){area.innerHTML='<div class="chat-empty"><p>Nenhuma mensagem</p></div>';return}const pauseBtn=paused?`<button class="btn btn-resume btn-sm" onclick="retomarClara('${id}')">▶ Retomar Clara</button>`:`<button class="btn btn-pause btn-sm" onclick="pausarClara('${id}')">⏸ Pausar Clara</button>`;const banner=paused?`<div class="chat-pause-banner">👤 Você assumiu — Clara pausada nesta conversa</div>`:'';const inputBar=paused?`<div class="chat-input-bar"><textarea id="manual-msg" placeholder="Digite sua mensagem..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();enviarMensagemManual('${id}')}"></textarea><button class="btn btn-p" onclick="enviarMensagemManual('${id}')">Enviar</button></div>`:'';area.innerHTML=`<div class="chat-tb"><div class="chat-info"><div class="chat-info-av" style="background:${gradient}">${initials}</div><div class="chat-info-text"><div class="chat-info-name">${display}</div><div class="chat-info-st"><span class="dot dot-g"></span>${conv?.status||'aberta'}${paused?' · 👤 humano':' · 🤖 Clara'}${campTag?' &nbsp; '+campTag:''}</div></div></div><div style="display:flex;gap:6px">${pauseBtn}<button class="btn btn-p btn-sm" onclick="registrarVendaConv('${conv?.lead_id||''}','${(name||'').replace(/'/g,'')}','${phone}')">💰 Matrícula</button></div></div>${banner}<div class="chat-msgs" id="ms">${msgs.map(m=>`<div class="mg ${m.role}"><div class="bub ${m.role}">${(m.content||'').replace(/</g,'&lt;')}</div><div class="bt">${new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>`).join('')}</div>${inputBar}`;document.getElementById('ms').scrollTop=99999;if(paused){const t=document.getElementById('manual-msg');if(t)t.focus()}}
function registrarVendaConv(leadId,name,phone){openModal('m-venda');setTimeout(()=>{if(leadId)document.getElementById('v-lead').value=leadId;if(name)document.getElementById('v-nome').value=name;if(phone)document.getElementById('v-tel').value=phone},50)}
async function pausarClara(convId){const r=await backend(`/api/conversas/${convId}/pausar`,{method:'POST'});if(r.ok&&r.data?.ok){showToast('⏸ Clara pausada — você assumiu');const c=allConvs.find(x=>x.id===convId);if(c)c.ia_active=false;renderConvList(convTab==='open'?allConvs.filter(c=>c.status==='aberta'):allConvs);const el=document.querySelector(`.ci[onclick*="${convId}"]`);if(el)openConv(convId,el)}else showToast('❌ '+(r.data?.error||'Erro ao pausar'))}
async function retomarClara(convId){const r=await backend(`/api/conversas/${convId}/retomar`,{method:'POST'});if(r.ok&&r.data?.ok){showToast('▶ Clara retomou o atendimento');const c=allConvs.find(x=>x.id===convId);if(c)c.ia_active=true;renderConvList(convTab==='open'?allConvs.filter(c=>c.status==='aberta'):allConvs);const el=document.querySelector(`.ci[onclick*="${convId}"]`);if(el)openConv(convId,el)}else showToast('❌ '+(r.data?.error||'Erro ao retomar'))}
async function enviarMensagemManual(convId){const ta=document.getElementById('manual-msg');if(!ta)return;const msg=ta.value.trim();if(!msg){showToast('Digite uma mensagem');return}ta.disabled=true;const r=await backend(`/api/conversas/${convId}/enviar`,{method:'POST',body:JSON.stringify({mensagem:msg})});ta.disabled=false;if(r.ok&&r.data?.ok){ta.value='';refreshOpenConv();showToast('✓ Mensagem enviada')}else{const err=r.data?.error||'Erro';const hint=r.data?.hint?` (${r.data.hint})`:'';showToast('❌ '+err+hint);ta.focus()}}
async function renderAgents(){const el=document.getElementById('agents-container');el.innerHTML='<div class="empty"><p>Carregando agentes...</p></div>';const list=await supa('agentes?select=*&order=created_at.desc');agents=list||[];if(!agents.length){el.innerHTML='<div class="empty-state"><h3>Nenhum agente ainda</h3><p>Clique em "Criar Agente" para criar o cérebro da sua Clara.</p></div>';return}el.innerHTML=`<div class="agents-grid">${agents.map(a=>{const initials=nameInitials(a.nome||'?');const gradient=nameToGradient(a.nome||'?');const defaultBadge=a.is_default?'<span class="pill pill-y" style="margin-left:6px">Padrão</span>':'';const ativo=a.ativo?'<span class="dot dot-g"></span>Ativo':'<span class="dot" style="background:var(--t4)"></span>Inativo';return`<div class="ag"><div class="ag-top"><div class="ag-icn" style="background:${gradient}">${initials}</div><div class="ag-st">${ativo}</div></div><div class="ag-name">${a.nome}${defaultBadge}</div><div class="ag-role">${a.objetivo||'Sem objetivo'}</div><div class="ag-acts"><button class="btn btn-g btn-sm" style="flex:1" onclick="editAgente('${a.id}')">Editar</button><button class="btn btn-r btn-sm" onclick="deleteAgente('${a.id}','${(a.nome||'').replace(/'/g,'')}')">Remover</button></div></div>`}).join('')}</div>`}

let agAtivo='identidade',agDados={cursos:[],objecoes:[],faq:[]},agAnexos={cursos:[],objecoes:[],playbook:[],faq:[]};
function setAgTab(tab){agAtivo=tab;document.querySelectorAll('.ag-modal-tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.ag-pane').forEach(p=>p.classList.remove('active'));document.getElementById('agtab-'+tab).classList.add('active');document.getElementById('agpane-'+tab).classList.add('active')}
function addCurso(c={}){agDados.cursos.push({nome:c.nome||'',preco:c.preco||'',parcelado:c.parcelado||'',carga:c.carga||'',garantia:c.garantia||'',certificado:c.certificado||'',publico:c.publico||'',diferencial:c.diferencial||'',link:c.link||'',descricao:c.descricao||''});renderCursos()}
function rmCurso(i){agDados.cursos.splice(i,1);renderCursos()} function addOferta(i){if(!agDados.cursos[i].ofertas)agDados.cursos[i].ofertas=[];agDados.cursos[i].ofertas.push({nome:'',valor:'',link:'',contexto:''});renderCursos()} function rmOferta(i,oi){agDados.cursos[i].ofertas.splice(oi,1);renderCursos()}
function renderCursos(){const el=document.getElementById('lista-cursos');el.innerHTML=agDados.cursos.map((c,i)=>{if(!c.ofertas)c.ofertas=[];const ofertasHtml=c.ofertas.map((o,oi)=>`<div style="background:var(--w);border:1px solid var(--b1);border-radius:9px;padding:12px;margin-bottom:8px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px"><span style="font-size:10px;font-weight:700;color:var(--gr);background:var(--grl);padding:3px 8px;border-radius:6px;letter-spacing:.04em">OFERTA ${oi+1}</span><button class="ag-rm-btn" onclick="rmOferta(${i},${oi})">✕</button></div><div class="fr2"><div class="fg"><label class="fl-l">Nome da oferta</label><input class="fi" placeholder="Ex: PIX à vista, Cartão 12x, Boleto, Desconto especial..." value="${(o.nome||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].ofertas[${oi}].nome=this.value"></div><div class="fg"><label class="fl-l">Valor</label><input class="fi" placeholder="Ex: R$ 997,00 ou 12x R$ 99,70" value="${(o.valor||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].ofertas[${oi}].valor=this.value"></div></div><div class="fg"><label class="fl-l">Link de checkout</label><input class="fi fmono" placeholder="https://pay.hotmart.com/..." value="${(o.link||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].ofertas[${oi}].link=this.value"></div><div class="fg"><label class="fl-l">Quando usar (opcional)</label><input class="fi" placeholder="Ex: padrão / quando lead pedir boleto / quando reclamar de preço" value="${(o.contexto||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].ofertas[${oi}].contexto=this.value"></div></div>`).join('');return`<div class="ag-list-item"><div class="ag-list-item-h"><span class="ag-list-item-num">CURSO #${i+1}</span><button class="ag-rm-btn" onclick="rmCurso(${i})">✕</button></div><div class="fr2"><div class="fg"><label class="fl-l">Nome do curso</label><input class="fi" value="${(c.nome||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].nome=this.value"></div><div class="fg"><label class="fl-l">Carga horária</label><input class="fi" value="${(c.carga||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].carga=this.value"></div></div><div class="fr2"><div class="fg"><label class="fl-l">Garantia</label><input class="fi" value="${(c.garantia||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].garantia=this.value"></div><div class="fg"><label class="fl-l">Certificado</label><input class="fi" value="${(c.certificado||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].certificado=this.value"></div></div><div class="fg"><label class="fl-l">Para quem é</label><input class="fi" value="${(c.publico||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].publico=this.value"></div><div class="fg"><label class="fl-l">Diferencial</label><input class="fi" value="${(c.diferencial||'').replace(/"/g,'&quot;')}" oninput="agDados.cursos[${i}].diferencial=this.value"></div><div class="fg"><label class="fl-l">Descrição completa</label><textarea class="fta" oninput="agDados.cursos[${i}].descricao=this.value">${(c.descricao||'').replace(/</g,'&lt;')}</textarea></div><div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--b1)"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gr);margin-bottom:10px;display:flex;align-items:center;gap:8px"><span style="width:3px;height:12px;background:var(--gr);border-radius:2px"></span>OFERTAS DISPONÍVEIS</div>${ofertasHtml}<button class="ag-list-add" style="background:var(--grl);border-color:var(--grb);color:var(--gr)" onclick="addOferta(${i})">＋ Adicionar Oferta</button></div></div>`}).join('')}
function addObjecao(o={}){agDados.objecoes.push({objecao:o.objecao||'',resposta:o.resposta||''});renderObjecoes()}
function rmObjecao(i){agDados.objecoes.splice(i,1);renderObjecoes()}
function renderObjecoes(){const el=document.getElementById('lista-objecoes');el.innerHTML=agDados.objecoes.map((o,i)=>`<div class="ag-list-item"><div class="ag-list-item-h"><span class="ag-list-item-num">OBJEÇÃO #${i+1}</span><button class="ag-rm-btn" onclick="rmObjecao(${i})">✕</button></div><div class="fg"><label class="fl-l">O que o lead diz</label><input class="fi" value="${(o.objecao||'').replace(/"/g,'&quot;')}" oninput="agDados.objecoes[${i}].objecao=this.value"></div><div class="fg"><label class="fl-l">Como responder</label><textarea class="fta" oninput="agDados.objecoes[${i}].resposta=this.value">${(o.resposta||'').replace(/</g,'&lt;')}</textarea></div></div>`).join('')}
function addFaq(f={}){agDados.faq.push({pergunta:f.pergunta||'',resposta:f.resposta||''});renderFaq()}
function rmFaq(i){agDados.faq.splice(i,1);renderFaq()}
function renderFaq(){const el=document.getElementById('lista-faq');el.innerHTML=agDados.faq.map((f,i)=>`<div class="ag-list-item"><div class="ag-list-item-h"><span class="ag-list-item-num">FAQ #${i+1}</span><button class="ag-rm-btn" onclick="rmFaq(${i})">✕</button></div><div class="fg"><label class="fl-l">Pergunta</label><input class="fi" value="${(f.pergunta||'').replace(/"/g,'&quot;')}" oninput="agDados.faq[${i}].pergunta=this.value"></div><div class="fg"><label class="fl-l">Resposta</label><textarea class="fta" oninput="agDados.faq[${i}].resposta=this.value">${(f.resposta||'').replace(/</g,'&lt;')}</textarea></div></div>`).join('')}
async function extractTextFromFile(file){const ext=file.name.split('.').pop().toLowerCase();if(ext==='txt')return await file.text();if(ext==='pdf'){const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const c=await page.getTextContent();text+=c.items.map(it=>it.str).join(' ')+'\n\n'}return text.trim()}if(ext==='docx'||ext==='doc'){const buf=await file.arrayBuffer();const r=await mammoth.extractRawText({arrayBuffer:buf});return r.value}return ''}
async function uploadToStorage(file,categoria){const ts=Date.now();const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${categoria}/${ts}_${safeName}`;const url=`${SUPA_URL}/storage/v1/object/agentes-arquivos/${path}`;const r=await fetch(url,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':`Bearer ${SUPA_KEY}`},body:file});if(!r.ok){const txt=await r.text();throw new Error('Upload: '+txt)}return `${SUPA_URL}/storage/v1/object/public/agentes-arquivos/${path}`}
async function handleAgFile(ev,categoria){const files=Array.from(ev.target.files||[]);if(!files.length)return;for(const file of files){if(file.size>50*1024*1024){showToast('❌ '+file.name+' >50MB');continue}showToast('📤 Lendo '+file.name+'...');try{const texto=await extractTextFromFile(file);let url='';try{url=await uploadToStorage(file,categoria)}catch(e){console.warn('Upload falhou:',e.message)}agAnexos[categoria].push({nome:file.name,tamanho:file.size,texto:texto,url:url,tipo:file.type||file.name.split('.').pop()});renderAgFiles(categoria);showToast('✓ '+file.name+' ('+(texto.length/1000).toFixed(1)+'k chars)')}catch(e){showToast('❌ '+e.message);console.error(e)}}ev.target.value=''}
function renderAgFiles(categoria){const el=document.getElementById('files-'+categoria);if(!el)return;el.innerHTML=agAnexos[categoria].map((a,i)=>{const ext=(a.nome.split('.').pop()||'').toUpperCase();const sz=a.tamanho>1024*1024?(a.tamanho/(1024*1024)).toFixed(1)+'MB':(a.tamanho/1024).toFixed(0)+'KB';return`<div class="ag-file"><div class="ag-file-icn">${ext}</div><div class="ag-file-info"><div class="ag-file-nm">${a.nome}</div><div class="ag-file-meta">${sz} · ${(a.texto.length/1000).toFixed(1)}k caracteres extraídos</div></div><button class="ag-file-rm" onclick="rmAgFile('${categoria}',${i})">✕</button></div>`}).join('')}
function rmAgFile(categoria,i){agAnexos[categoria].splice(i,1);renderAgFiles(categoria)}
function openNewAgent(){editingId=null;document.getElementById('m-agente-title').textContent='Criar Agente';['ag-nome','ag-objetivo','ag-quem','ag-escreve','ag-sempre','ag-nunca','ag-pb-abertura','ag-pb-qualif','ag-pb-apres','ag-pb-preco','ag-pb-fech','ag-pb-recup','ag-esc-quando','ag-esc-frase','ag-esc-nome','ag-esc-tel','ag-esc-encerrar'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('ag-tom').value='amigavel';document.getElementById('ag-default').checked=false;agDados={cursos:[],objecoes:[],faq:[]};agAnexos={cursos:[],objecoes:[],playbook:[],faq:[]};renderCursos();renderObjecoes();renderFaq();['cursos','objecoes','playbook','faq'].forEach(c=>renderAgFiles(c));setAgTab('identidade');openModal('m-agente')}
function editAgente(id){editingId=id;const a=agents.find(x=>x.id===id);if(!a)return;document.getElementById('m-agente-title').textContent='Editar — '+a.nome;document.getElementById('ag-nome').value=a.nome||'';document.getElementById('ag-objetivo').value=a.objetivo||'';document.getElementById('ag-tom').value=a.tom||'amigavel';document.getElementById('ag-default').checked=!!a.is_default;const d=a.dados_estruturados||{};document.getElementById('ag-quem').value=d.quem||'';document.getElementById('ag-escreve').value=d.escreve||'';document.getElementById('ag-sempre').value=d.sempre||'';document.getElementById('ag-nunca').value=d.nunca||'';document.getElementById('ag-pb-abertura').value=d.pb_abertura||'';document.getElementById('ag-pb-qualif').value=d.pb_qualif||'';document.getElementById('ag-pb-apres').value=d.pb_apres||'';document.getElementById('ag-pb-preco').value=d.pb_preco||'';document.getElementById('ag-pb-fech').value=d.pb_fech||'';document.getElementById('ag-pb-recup').value=d.pb_recup||'';document.getElementById('ag-esc-quando').value=d.esc_quando||'';document.getElementById('ag-esc-frase').value=d.esc_frase||'';document.getElementById('ag-esc-nome').value=d.esc_nome||'';document.getElementById('ag-esc-tel').value=d.esc_tel||'';document.getElementById('ag-esc-encerrar').value=d.esc_encerrar||'';agDados={cursos:d.cursos||[],objecoes:d.objecoes||[],faq:d.faq||[]};agAnexos=a.anexos&&typeof a.anexos==='object'?{cursos:a.anexos.cursos||[],objecoes:a.anexos.objecoes||[],playbook:a.anexos.playbook||[],faq:a.anexos.faq||[]}:{cursos:[],objecoes:[],playbook:[],faq:[]};renderCursos();renderObjecoes();renderFaq();['cursos','objecoes','playbook','faq'].forEach(c=>renderAgFiles(c));setAgTab('identidade');openModal('m-agente')}
async function deleteAgente(id,nome){if(!confirm(`Apagar o agente "${nome}"?`))return;const r=await supaDelete('agentes',id);if(r){showToast('✓ Agente removido');renderAgents()}else showToast('Erro ao remover')}
function buildSystemPrompt(){const nome=document.getElementById('ag-nome').value.trim();const obj=document.getElementById('ag-objetivo').value.trim();const tom=document.getElementById('ag-tom').value;const quem=document.getElementById('ag-quem').value.trim();const escreve=document.getElementById('ag-escreve').value.trim();const sempre=document.getElementById('ag-sempre').value.trim();const nunca=document.getElementById('ag-nunca').value.trim();const pb={a:document.getElementById('ag-pb-abertura').value.trim(),q:document.getElementById('ag-pb-qualif').value.trim(),ap:document.getElementById('ag-pb-apres').value.trim(),pr:document.getElementById('ag-pb-preco').value.trim(),f:document.getElementById('ag-pb-fech').value.trim(),r:document.getElementById('ag-pb-recup').value.trim()};const esc={q:document.getElementById('ag-esc-quando').value.trim(),f:document.getElementById('ag-esc-frase').value.trim(),n:document.getElementById('ag-esc-nome').value.trim(),t:document.getElementById('ag-esc-tel').value.trim(),e:document.getElementById('ag-esc-encerrar').value.trim()};let p=`# IDENTIDADE\nVocê é ${nome||'a Clara'}, ${quem||'consultora de vendas'}.\nObjetivo: ${obj||'conduzir o lead até a matrícula'}.\nTom de voz: ${tom}.\n\n`;if(escreve)p+=`# COMO VOCÊ ESCREVE\n${escreve}\n\n`;if(sempre)p+=`# VOCÊ SEMPRE\n${sempre}\n\n`;if(nunca)p+=`# VOCÊ NUNCA\n${nunca}\n\n`;const pbParts=[];if(pb.a)pbParts.push(`1. ABERTURA:\n${pb.a}`);if(pb.q)pbParts.push(`2. QUALIFICAÇÃO:\n${pb.q}`);if(pb.ap)pbParts.push(`3. APRESENTAÇÃO:\n${pb.ap}`);if(pb.pr)pbParts.push(`4. PREÇO:\n${pb.pr}`);if(pb.f)pbParts.push(`5. FECHAMENTO:\n${pb.f}`);if(pb.r)pbParts.push(`6. RECUPERAÇÃO:\n${pb.r}`);if(pbParts.length)p+=`# PLAYBOOK DE VENDA\n${pbParts.join('\n\n')}\n\n`;const escParts=[];if(esc.q)escParts.push(`QUANDO PASSAR PRA HUMANO:\n${esc.q}`);if(esc.f)escParts.push(`COMO PASSAR:\n"${esc.f}"`);if(esc.n||esc.t)escParts.push(`HUMANO DE CONTATO: ${esc.n} ${esc.t}`.trim());if(esc.e)escParts.push(`QUANDO ENCERRAR:\n${esc.e}`);if(escParts.length)p+=`# ESCALAÇÃO E ENCERRAMENTO\n${escParts.join('\n\n')}\n\n`;return p.trim()}
function buildBaseConhecimento(){let b='';if(agDados.cursos.length){b+='# CURSOS\n\n';agDados.cursos.forEach((c,i)=>{b+=`## CURSO ${i+1}: ${c.nome||'(sem nome)'}\n`;if(c.carga)b+=`- Carga horária: ${c.carga}\n`;if(c.garantia)b+=`- Garantia: ${c.garantia}\n`;if(c.certificado)b+=`- Certificado: ${c.certificado}\n`;if(c.publico)b+=`- Para quem é: ${c.publico}\n`;if(c.diferencial)b+=`- Diferencial: ${c.diferencial}\n`;if(c.descricao)b+=`\n${c.descricao}\n`;if(c.ofertas&&c.ofertas.length){b+=`\n### OFERTAS DISPONÍVEIS DESSE CURSO:\n`;c.ofertas.forEach((o,oi)=>{b+=`\nOFERTA ${oi+1}: ${o.nome||'(sem nome)'}\n`;if(o.valor)b+=`  Valor: ${o.valor}\n`;if(o.link)b+=`  Link de checkout: ${o.link}\n`;if(o.contexto)b+=`  Quando usar: ${o.contexto}\n`});b+=`\nIMPORTANTE: Quando o lead pedir link de pagamento ou aceitar comprar, use a OFERTA mais adequada ao contexto. Se pediu boleto, use a oferta de boleto. Se reclamou de preço, use a com desconto. Sempre mande o link COMPLETO, sem encurtar.\n`}b+='\n'})}if(agAnexos.cursos.length){b+='# DOCS — CURSOS\n\n';agAnexos.cursos.forEach(a=>{b+=`### ${a.nome}\n${a.texto}\n\n`})}if(agDados.objecoes.length){b+='# OBJEÇÕES\n\n';agDados.objecoes.forEach((o,i)=>{b+=`## "${o.objecao}"\nResposta: ${o.resposta}\n\n`})}if(agAnexos.objecoes.length){b+='# DOCS — OBJEÇÕES\n\n';agAnexos.objecoes.forEach(a=>{b+=`### ${a.nome}\n${a.texto}\n\n`})}if(agAnexos.playbook.length){b+='# DOCS — PLAYBOOK\n\n';agAnexos.playbook.forEach(a=>{b+=`### ${a.nome}\n${a.texto}\n\n`})}if(agDados.faq.length){b+='# FAQ\n\n';agDados.faq.forEach((f,i)=>{b+=`## ${f.pergunta}\nR: ${f.resposta}\n\n`})}if(agAnexos.faq.length){b+='# DOCS — FAQ\n\n';agAnexos.faq.forEach(a=>{b+=`### ${a.nome}\n${a.texto}\n\n`})}return b.trim()}
async function saveAgente(){const nome=document.getElementById('ag-nome').value.trim();if(!nome){showToast('Dê um nome ao agente');setAgTab('identidade');return}const btn=document.getElementById('btn-save-agente');btn.disabled=true;btn.textContent='Salvando...';btn.style.opacity='.6';const isDefault=document.getElementById('ag-default').checked;const dadosEst={quem:document.getElementById('ag-quem').value,escreve:document.getElementById('ag-escreve').value,sempre:document.getElementById('ag-sempre').value,nunca:document.getElementById('ag-nunca').value,cursos:agDados.cursos,objecoes:agDados.objecoes,faq:agDados.faq,pb_abertura:document.getElementById('ag-pb-abertura').value,pb_qualif:document.getElementById('ag-pb-qualif').value,pb_apres:document.getElementById('ag-pb-apres').value,pb_preco:document.getElementById('ag-pb-preco').value,pb_fech:document.getElementById('ag-pb-fech').value,pb_recup:document.getElementById('ag-pb-recup').value,esc_quando:document.getElementById('ag-esc-quando').value,esc_frase:document.getElementById('ag-esc-frase').value,esc_nome:document.getElementById('ag-esc-nome').value,esc_tel:document.getElementById('ag-esc-tel').value,esc_encerrar:document.getElementById('ag-esc-encerrar').value};const data={nome,objetivo:document.getElementById('ag-objetivo').value,tom:document.getElementById('ag-tom').value,system_prompt:buildSystemPrompt(),base_conhecimento:buildBaseConhecimento(),dados_estruturados:dadosEst,anexos:agAnexos,is_default:isDefault,ativo:true,updated_at:new Date()};if(isDefault)await supa('agentes?is_default=eq.true',{method:'PATCH',body:JSON.stringify({is_default:false})});let r;if(editingId)r=await supaUpdate('agentes',editingId,data);else r=await supaInsert('agentes',data);btn.disabled=false;btn.textContent='Salvar Agente';btn.style.opacity='1';if(r){closeModal('m-agente');editingId=null;renderAgents();showToast('✓ Agente salvo — Clara já tá usando')}else showToast('Erro ao salvar')}
async function loadLeads(filter='todos',q=''){const leads=await supa('leads?select=*&order=created_at.desc');allLeads=leads||[];let list=allLeads;if(filter!=='todos')list=list.filter(l=>(l.stage||'novo')===filter);if(q)list=list.filter(l=>JSON.stringify(l).toLowerCase().includes(q.toLowerCase()));document.getElementById('leads-sub').textContent=`${list.length} de ${allLeads.length} leads`;const pc=s=>({novo:'pill-b',qualificado:'pill-y',negociando:'pill-p',matriculado:'pill-g',perdido:'pill-r'}[s]||'pill-b');document.getElementById('leads-tbody').innerHTML=list.length?list.map((l,i)=>`<tr><td style="color:var(--t3)">${i+1}</td><td class="fmono">${fmtPhone(l.phone)}</td><td>${l.name||'<span style="color:var(--t3)">—</span>'}</td><td><span class="pill ${pc(l.stage||'novo')}">${l.stage||'novo'}</span></td><td style="color:var(--t2)">${new Date(l.created_at).toLocaleDateString('pt-BR')}</td></tr>`).join(''):'<tr><td colspan="5"><div class="empty"><p>Nenhum lead</p></div></td></tr>'}
function filterLeads(v){loadLeads(v)}
function searchLeads(q){loadLeads('todos',q)}
async function loadCanalStats(){const el=document.getElementById('canais-container');el.innerHTML='<div class="empty"><p>Carregando...</p></div>';const[waba,phones,msgs,leads]=await Promise.all([backend('/api/waba-info'),backend('/api/phone-numbers'),supa('mensagens?select=id'),supa('leads?select=id')]);document.getElementById('canais-sub').textContent='1 conta WhatsApp Business conectada';if(!waba.ok){el.innerHTML=`<div class="empty-state"><h3>Erro ao buscar BM</h3><p>${waba.data?.error||waba.error||'Verifique backend'}</p></div>`;return}const w=waba.data?.data||{};const phoneList=phones.ok?(phones.data?.data||[]):[];const totalMsgs=msgs?.length||0;const totalLeads=leads?.length||0;el.innerHTML=`<div class="bm-card"><div class="bm-h"><div><div class="bm-title">${w.name||'Clara'}</div><div class="bm-id">WABA ID: ${w.id||'—'}</div></div><span class="cbadge cb-ok"><span class="dot dot-g"></span>Verificado</span></div><div class="bm-info-grid"><div class="bm-info-item"><span class="bm-info-l">Empresa</span><span class="bm-info-v">${w.owner_business_info?.name||'—'}</span></div><div class="bm-info-item"><span class="bm-info-l">Moeda</span><span class="bm-info-v">${w.currency||'—'}</span></div><div class="bm-info-item"><span class="bm-info-l">Total mensagens</span><span class="bm-info-v">${totalMsgs}</span></div><div class="bm-info-item"><span class="bm-info-l">Total leads</span><span class="bm-info-v">${totalLeads}</span></div></div><div style="font-size:12px;font-weight:700;color:var(--t2);text-transform:uppercase;margin-top:18px;margin-bottom:10px">Números (${phoneList.length})</div>${phoneList.length?phoneList.map(p=>`<div class="phone-card"><div class="phone-h"><div><div class="phone-num">${p.display_phone_number||'—'}</div><div class="phone-name">${p.verified_name||'(sem nome)'}</div></div></div><div class="phone-stats"><span class="phone-stat">Tier: <strong>${p.messaging_limit_tier||'—'}</strong></span> <span class="phone-stat">Qualidade: <strong>${p.quality_rating||'N/A'}</strong></span></div></div>`).join(''):'<div class="empty"><p>Nenhum número</p></div>'}</div>`}
function showCfg(sec,el){document.querySelectorAll('.cfg-ni').forEach(n=>n.classList.remove('active'));['perfil','senha','sistema','equipe'].forEach(s=>{const e=document.getElementById('cfg-'+s);if(e)e.style.display='none'});if(el)el.classList.add('active');const target=document.getElementById('cfg-'+sec);if(target)target.style.display='block';if(sec==='equipe')loadEquipe()}

// ============= GESTÃO DE EQUIPE =============
let selectedRole='operador',editingUserId=null;
function selectRole(r){selectedRole=r;document.querySelectorAll('.role-card').forEach(c=>c.classList.toggle('selected',c.dataset.role===r))}
function openNewUser(){editingUserId=null;document.getElementById('m-user-title').textContent='+ Adicionar Usuário';['u-nome','u-cargo','u-email','u-senha'].forEach(id=>document.getElementById(id).value='');document.getElementById('btn-save-user').textContent='Criar Usuário';document.getElementById('u-email').disabled=false;selectRole('operador');openModal('m-user')}
async function saveUser(){const nome=document.getElementById('u-nome').value.trim();const cargo=document.getElementById('u-cargo').value.trim();const email=document.getElementById('u-email').value.trim().toLowerCase();const senha=document.getElementById('u-senha').value;if(!nome||!email||(!editingUserId&&!senha)){showToast('Preencha nome, email e senha');return}if(senha&&senha.length<6){showToast('Senha mínimo 6 caracteres');return}const btn=document.getElementById('btn-save-user');btn.disabled=true;btn.textContent='Salvando...';const data={nome,email,role:selectedRole,cargo:cargo||null};if(senha)data.senha=senha;let r;if(editingUserId){r=await supaUpdate('usuarios',editingUserId,data)}else{r=await supaInsert('usuarios',data)}btn.disabled=false;btn.textContent=editingUserId?'Salvar Alterações':'Criar Usuário';if(r){showToast('✓ Usuário '+(editingUserId?'atualizado':'criado'));closeModal('m-user');loadEquipe()}else showToast('❌ Erro — email já existe?')}
async function loadEquipe(){const list=document.getElementById('equipe-list');list.innerHTML='<div class="empty"><p>Carregando...</p></div>';const users=await supa('usuarios?select=*&order=created_at.desc');if(!users){list.innerHTML='<div class="empty-state"><h3>Erro</h3><p>Não consegui carregar a equipe</p></div>';return}document.getElementById('equipe-sub').textContent=`${users.length} usuário(s) com acesso`;if(!users.length){list.innerHTML='<div class="empty-state"><h3>Nenhum usuário</h3><p>Adicione o primeiro colaborador</p></div>';return}list.innerHTML=users.map(u=>{const initials=nameInitials(u.nome);const grad=nameToGradient(u.nome);const isMe=currentUser?.id===u.id;const roleClass='role-'+u.role;const ativoBadge=u.ativo?'':' <span class="role-pill" style="background:var(--rdl);color:var(--rd);border:1px solid var(--rdb)">Inativo</span>';return`<div class="user-row"><div class="user-row-av" style="background:${grad}">${initials}</div><div class="user-row-info"><div class="user-row-name">${u.nome}${isMe?' <span class="role-pill" style="background:var(--grl);color:var(--gr);border:1px solid var(--grb)">Você</span>':''}${ativoBadge}</div><div class="user-row-meta"><span class="role-pill ${roleClass}">${ROLE_LABELS[u.role]||u.role}</span><span>${u.email}</span>${u.cargo?'<span>· '+u.cargo+'</span>':''}</div></div><div class="user-row-actions">${isMe?'':`<button class="btn btn-g btn-sm" onclick="editUser('${u.id}')">Editar</button><button class="btn btn-r btn-sm" onclick="deleteUser('${u.id}','${(u.nome||'').replace(/'/g,'')}')">Remover</button>`}</div></div>`}).join('')}
async function editUser(id){const users=await supa(`usuarios?id=eq.${id}&select=*`);if(!users||!users[0]){showToast('Usuário não encontrado');return}const u=users[0];editingUserId=id;document.getElementById('m-user-title').textContent='Editar — '+u.nome;document.getElementById('u-nome').value=u.nome||'';document.getElementById('u-cargo').value=u.cargo||'';document.getElementById('u-email').value=u.email||'';document.getElementById('u-email').disabled=true;document.getElementById('u-senha').value='';document.getElementById('u-senha').placeholder='Deixe vazio pra manter a senha atual';document.getElementById('btn-save-user').textContent='Salvar Alterações';selectRole(u.role||'operador');openModal('m-user')}
async function deleteUser(id,nome){if(!confirm(`Remover acesso de "${nome}"?\n\nEle não poderá mais entrar no CRM.`))return;const r=await supaDelete('usuarios',id);if(r){showToast('✓ Usuário removido');loadEquipe()}else showToast('Erro ao remover')}

function handleAvatar(inp){if(!inp.files[0])return;const r=new FileReader();r.onload=async e=>{const src=e.target.result;document.getElementById('cfg-avatar').innerHTML=`<img src="${src}">`;document.getElementById('sidebar-av').innerHTML=`<img src="${src}">`;if(currentUser){currentUser.avatar=src;localStorage.setItem('clara-session',JSON.stringify(currentUser));await supaUpdate('usuarios',currentUser.id,{avatar:src})}};r.readAsDataURL(inp.files[0])}
async function savePerfil(){const name=document.getElementById('cfg-name').value.trim();const role=document.getElementById('cfg-role-inp').value.trim();if(!name){showToast('Preencha o nome');return}if(currentUser){currentUser.name=name;currentUser.cargo=role;localStorage.setItem('clara-session',JSON.stringify(currentUser));await supaUpdate('usuarios',currentUser.id,{nome:name,cargo:role});updateUserUI(currentUser)}showToast('✓ Perfil salvo')}
async function alterarSenha(){const atual=document.getElementById('s-atual').value;const nova=document.getElementById('s-nova').value;const conf=document.getElementById('s-conf').value;const err=document.getElementById('s-err');if(nova!==conf){err.style.display='block';err.textContent='Senhas não coincidem';return}if(nova.length<6){err.style.display='block';err.textContent='Mín 6 caracteres';return}if(!currentUser){err.style.display='block';err.textContent='Sem sessão';return}const check=await supa(`usuarios?id=eq.${currentUser.id}&senha=eq.${encodeURIComponent(atual)}&select=id`);if(!check||!check.length){err.style.display='block';err.textContent='Senha atual incorreta';return}err.style.display='none';await supaUpdate('usuarios',currentUser.id,{senha:nova});['s-atual','s-nova','s-conf'].forEach(id=>document.getElementById(id).value='');showToast('✓ Senha alterada')}
async function checkSys(){const r=await supa('leads?select=id&limit=1');const el=document.getElementById('sys-db');if(el){el.textContent=r!==null?'✓ Conectado':'✗ Erro';el.style.color=r!==null?'var(--gr)':'var(--rd)'}}
async function loadAll(){showToast('Atualizando...');await loadHome();if(document.getElementById('page-dashboard').classList.contains('active'))await loadDashboard();showToast('✓ Atualizado')}
async function loadTemplates(){const el=document.getElementById('templates-container');el.innerHTML='<div class="empty"><p>Carregando...</p></div>';const res=await backend('/api/templates');if(!res.ok||!res.data?.ok){el.innerHTML=`<div class="empty-state"><h3>Erro</h3><p>${res.data?.error||res.error}</p></div>`;return}const templates=res.data.data||[];document.getElementById('tpl-sub').textContent=`${templates.length} template(s)`;if(!templates.length){el.innerHTML='<div class="empty-state"><h3>Nenhum template</h3></div>';return}el.innerHTML=`<div class="tpl-grid">${templates.map(t=>{const body=(t.components||[]).find(c=>c.type==='BODY')?.text||'';const status=(t.status||'').toLowerCase();const statusLabel={approved:'Aprovado',pending:'Pendente',rejected:'Rejeitado',paused:'Pausado'}[status]||t.status;const statusClass=status==='approved'?'tpl-stat-aprovado':status==='pending'?'tpl-stat-pendente':status==='rejected'?'tpl-stat-rejeitado':'tpl-stat-pausado';return`<div class="tpl"><div class="tpl-h"><div style="flex:1;min-width:0"><div class="tpl-name">${t.name}</div></div><span class="pill ${statusClass}">${statusLabel}</span></div><div class="tpl-body">${(body||'(sem corpo)').slice(0,250).replace(/</g,'&lt;')}</div><div class="tpl-acts"><button class="btn btn-g btn-sm" style="flex:1" onclick="copyTemplateName('${t.name}')">📋 Copiar</button><button class="btn btn-r btn-sm" onclick="deleteTemplate('${t.name}')">Excluir</button></div></div>`}).join('')}</div>`}
function openNewTemplate(){['t-name','t-header','t-body','t-footer'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('t-category').value='MARKETING';document.getElementById('t-language').value='pt_BR';openModal('m-template')}
async function submitTemplate(){const name=document.getElementById('t-name').value.trim();const category=document.getElementById('t-category').value;const language=document.getElementById('t-language').value;const header=document.getElementById('t-header').value;const body=document.getElementById('t-body').value.trim();const footer=document.getElementById('t-footer').value;if(!name||!body){showToast('Nome e corpo obrigatórios');return}const btn=document.getElementById('btn-submit-t');btn.textContent='Enviando...';btn.disabled=true;const res=await backend('/api/templates',{method:'POST',body:JSON.stringify({name,category,language,header,body,footer})});btn.textContent='Submeter à Meta';btn.disabled=false;if(res.ok&&res.data?.ok){showToast('✓ Enviado');closeModal('m-template');setTimeout(loadTemplates,800)}else showToast('❌ '+(res.data?.error||'Erro'))}
async function deleteTemplate(name){if(!confirm(`Apagar "${name}"?`))return;const res=await backend(`/api/templates/${encodeURIComponent(name)}`,{method:'DELETE'});if(res.ok&&res.data?.ok){showToast('✓ Removido');loadTemplates()}else showToast('❌ '+(res.data?.error||'Erro'))}
function copyTemplateName(name){navigator.clipboard?.writeText(name).then(()=>showToast('✓ Copiado: '+name),()=>showToast('Erro'))}
let campStepCurrent=1,campData={leads:[]},allTemplatesAprovados=[],allAgentes=[];
async function loadCampanhas(){const el=document.getElementById('campanhas-container');el.innerHTML='<div class="empty"><p>Carregando...</p></div>';const list=await supa('campanhas?select=*&order=created_at.desc');if(!list){el.innerHTML='<div class="empty-state"><h3>Erro</h3></div>';return}document.getElementById('camp-sub').textContent=`${list.length} campanha(s)`;if(!list.length){el.innerHTML='<div class="empty-state"><h3>Nenhuma campanha</h3><p>Clique em "Nova Campanha".</p></div>';return}el.innerHTML=`<div class="camp-grid">${list.map(c=>{const stClass='camp-stat-'+c.status;const stLabel={rascunho:'Rascunho',disparando:'Disparando...',concluida:'Concluída',pausada:'Pausada',erro:'Erro'}[c.status]||c.status;return`<div class="camp"><div class="camp-h"><div style="flex:1;min-width:0"><div class="camp-name">${c.nome}</div><div class="camp-desc">${c.descricao||'Sem descrição'}</div><div class="camp-meta">📩 ${c.template_name}</div></div><span class="pill ${stClass}">${stLabel}</span></div><div class="camp-stats"><div class="camp-st"><div class="camp-stn">${c.total_leads||0}</div><div class="camp-stl">Total</div></div><div class="camp-st"><div class="camp-stn">${c.enviados||0}</div><div class="camp-stl">Enviados</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--bl)">${c.entregues||0}</div><div class="camp-stl">Entregues</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--gr)">${c.respondidos||0}</div><div class="camp-stl">Respond.</div></div></div><div class="camp-acts"><button class="btn btn-g btn-sm" style="flex:1" onclick="verCampanha('${c.id}')">Ver</button>${c.status==='rascunho'?`<button class="btn btn-p btn-sm" onclick="dispararCampanha('${c.id}','${c.nome.replace(/'/g,'')}')">🚀</button>`:''}<button class="btn btn-r btn-sm" onclick="deleteCampanha('${c.id}','${c.nome.replace(/'/g,'')}')">🗑</button></div></div>`}).join('')}</div>`}
async function openNewCampanha(){campStepCurrent=1;campData={leads:[]};['c-nome','c-desc'].forEach(id=>document.getElementById(id).value='');document.getElementById('csv-preview').style.display='none';document.getElementById('c-template-preview').style.display='none';document.getElementById('c-vars-info').style.display='none';showCampStep(1);openModal('m-camp');const[tplRes,agList]=await Promise.all([backend('/api/templates'),supa('agentes?select=*&ativo=eq.true&order=created_at.desc')]);allTemplatesAprovados=tplRes.ok?(tplRes.data?.data||[]).filter(t=>t.status==='APPROVED'):[];allAgentes=agList||[];const tplSel=document.getElementById('c-template');tplSel.innerHTML=allTemplatesAprovados.length?'<option value="">Selecione...</option>'+allTemplatesAprovados.map(t=>`<option value="${t.name}">${t.name}</option>`).join(''):'<option value="">Nenhum template aprovado</option>';const agSel=document.getElementById('c-agente');agSel.innerHTML=allAgentes.length?allAgentes.map(a=>`<option value="${a.id}"${a.is_default?' selected':''}>${a.nome}${a.is_default?' (padrão)':''}</option>`).join(''):'<option value="">Nenhum agente</option>'}
function showCampStep(n){campStepCurrent=n;['camp-s1','camp-s2','camp-s3','camp-s4'].forEach((id,i)=>{document.getElementById(id).style.display=(i+1===n)?'block':'none'});const titles={1:'Identificação',2:'Template',3:'Agente IA',4:'Importar Leads'};document.getElementById('camp-step-title').textContent=`Nova Campanha — Passo ${n} de 4`;document.getElementById('camp-step-sub').textContent=titles[n];document.getElementById('camp-btn-back').style.display=n>1?'inline-flex':'none';document.getElementById('camp-btn-next').textContent=n<4?'Próximo →':'Criar Campanha'}
function campStep(delta){const n=campStepCurrent+delta;if(delta>0){if(campStepCurrent===1){const nome=document.getElementById('c-nome').value.trim();if(!nome){showToast('Nome obrigatório');return}campData.nome=nome;campData.descricao=document.getElementById('c-desc').value}else if(campStepCurrent===2){const tpl=document.getElementById('c-template').value;if(!tpl){showToast('Escolha template');return}campData.template_name=tpl;const t=allTemplatesAprovados.find(x=>x.name===tpl);campData.template_language=t?.language||'pt_BR'}else if(campStepCurrent===3){const ag=document.getElementById('c-agente').value;if(!ag){showToast('Escolha agente');return}campData.agente_id=ag}else if(campStepCurrent===4){if(!campData.leads.length){showToast('Importe leads');return}criarCampanha();return}}if(n<1||n>4)return;showCampStep(n)}
function updateTemplatePreview(){const name=document.getElementById('c-template').value;const t=allTemplatesAprovados.find(x=>x.name===name);const prev=document.getElementById('c-template-preview');const varsInfo=document.getElementById('c-vars-info');if(!t){prev.style.display='none';varsInfo.style.display='none';return}const body=(t.components||[]).find(c=>c.type==='BODY')?.text||'';prev.textContent=body;prev.style.display='block';const vars=(body.match(/\{\{\d+\}\}/g)||[]).filter((v,i,a)=>a.indexOf(v)===i);if(vars.length){document.getElementById('c-vars-count').textContent=vars.length;varsInfo.style.display='block'}else varsInfo.style.display='none'}
function handleCSV(file){if(!file)return;const reader=new FileReader();reader.onload=e=>parseCSV(e.target.result);reader.readAsText(file)}
function parseCSV(text){const lines=text.split(/\r?\n/).filter(l=>l.trim());const leads=[];for(let i=0;i<lines.length;i++){const line=lines[i].trim();if(!line)continue;if(i===0&&!/\d{8,}/.test(line))continue;const parts=line.split(/[,;\t]/).map(p=>p.trim().replace(/^["']|["']$/g,''));let nome='',telefone='',vars=[];if(parts.length===1)telefone=parts[0];else if(parts.length>=2){const p0=parts[0].replace(/\D/g,'').length;const p1=parts[1].replace(/\D/g,'').length;if(p0>=10&&p1<10){telefone=parts[0];nome=parts[1]||'';vars=parts.slice(2)}else if(p1>=10){nome=parts[0]||'';telefone=parts[1];vars=parts.slice(2)}else{nome=parts[0]||'';telefone=parts[1]||'';vars=parts.slice(2)}}telefone=telefone.replace(/\D/g,'');if(telefone.length<10)continue;if(telefone.length===10||telefone.length===11)telefone='55'+telefone;if(!nome)nome=`Lead ${leads.length+1}`;leads.push({nome,phone:telefone,vars})}campData.leads=leads;updateCSVPreview();showToast(leads.length?`✓ ${leads.length} leads`:'❌ Nenhum válido')}
function updateCSVPreview(){const c=document.getElementById('csv-preview');document.getElementById('csv-count').textContent=campData.leads.length;if(!campData.leads.length){c.style.display='none';return}c.style.display='block';document.getElementById('csv-preview-body').innerHTML=campData.leads.slice(0,10).map((l,i)=>`<div class="csv-preview-row"><strong>${i+1}.</strong> ${l.nome} — ${l.phone}</div>`).join('')+(campData.leads.length>10?`<div class="csv-preview-row" style="color:var(--t3)">+ ${campData.leads.length-10}</div>`:'')}
async function usarLeadsExistentes(){if(!allLeads.length){const r=await supa('leads?select=*&order=created_at.desc&limit=500');allLeads=r||[]}if(!allLeads.length){showToast('Nenhum lead');return}if(!confirm(`Usar ${allLeads.length} leads?`))return;campData.leads=allLeads.map(l=>({nome:l.name||'',phone:l.phone,vars:[]}));updateCSVPreview();showToast(`✓ ${campData.leads.length} importados`)}
function colarLeads(){const txt=prompt('Cole leads (nome, telefone por linha)');if(!txt)return;parseCSV(txt)}
async function criarCampanha(){const data={nome:campData.nome,descricao:campData.descricao||null,template_name:campData.template_name,template_language:campData.template_language,agente_id:campData.agente_id,status:'rascunho',total_leads:campData.leads.length};const camp=await supaInsert('campanhas',data);if(!camp||!camp[0]){showToast('Erro');return}const campanhaId=camp[0].id;const envios=campData.leads.map(l=>({campanha_id:campanhaId,phone:l.phone,nome:l.nome||null,variaveis:[l.nome||'amigo',...(l.vars||[])],status:'pendente'}));for(let i=0;i<envios.length;i+=50){await supaInsert('campanha_envios',envios.slice(i,i+50))}closeModal('m-camp');showToast('✓ Campanha criada');loadCampanhas()}
async function dispararCampanha(id,nome){if(!confirm(`Disparar "${nome}"?`))return;const r=await backend(`/api/campanhas/${id}/disparar`,{method:'POST'});if(r.ok){showToast('🚀 Iniciado');setTimeout(loadCampanhas,1500)}else showToast('❌ '+(r.data?.error||'Erro'))}
async function deleteCampanha(id,nome){if(!confirm(`Apagar "${nome}"?`))return;const r=await supaDelete('campanhas',id);if(r){showToast('✓ Removida');loadCampanhas()}else showToast('Erro')}
async function verCampanha(id){const camp=await supa(`campanhas?select=*,agentes(nome)&id=eq.${id}`);if(!camp||!camp[0])return;const c=camp[0];const envios=await supa(`campanha_envios?select=*&campanha_id=eq.${id}&order=created_at.desc&limit=200`);const list=envios||[];const stCount={pendente:0,enviado:0,entregue:0,lido:0,respondido:0,erro:0};list.forEach(e=>{stCount[e.status]=(stCount[e.status]||0)+1});const stClass='camp-stat-'+c.status;const stLabel={rascunho:'Rascunho',disparando:'Disparando...',concluida:'Concluída',pausada:'Pausada',erro:'Erro'}[c.status]||c.status;document.getElementById('camp-detail-body').innerHTML=`<div class="mt">${c.nome} <span class="pill ${stClass}">${stLabel}</span></div><div class="ms">${c.descricao||'Sem descrição'}</div><div class="camp-stats"><div class="camp-st"><div class="camp-stn">${stCount.pendente}</div><div class="camp-stl">Pendente</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--bl)">${stCount.enviado}</div><div class="camp-stl">Enviado</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--bl)">${stCount.entregue}</div><div class="camp-stl">Entregue</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--gr)">${stCount.respondido}</div><div class="camp-stl">Resp.</div></div><div class="camp-st"><div class="camp-stn" style="color:var(--rd)">${stCount.erro}</div><div class="camp-stl">Erro</div></div></div><div style="max-height:280px;overflow-y:auto;background:var(--bg);border:1px solid var(--b1);border-radius:9px">${list.length?list.slice(0,50).map(e=>`<div style="padding:9px 14px;border-bottom:1px solid var(--b1);font-size:12px;display:flex;justify-content:space-between"><div><strong>${e.nome||'(sem nome)'}</strong> <span class="fmono" style="color:var(--t3)">${e.phone}</span></div><span style="font-weight:600;font-size:11px">${e.status}</span></div>`).join(''):'<div class="empty"><p>Sem envios</p></div>'}</div><div class="macts"><button class="btn btn-g" onclick="closeModal('m-camp-detail')">Fechar</button>${c.status==='rascunho'?`<button class="btn btn-p" onclick="closeModal('m-camp-detail');dispararCampanha('${c.id}','${c.nome.replace(/'/g,'')}')">🚀 Disparar</button>`:''}</div>`;openModal('m-camp-detail')}
document.addEventListener('DOMContentLoaded',()=>{const dz=document.getElementById('csv-drop');if(!dz)return;dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragover')});dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)handleCSV(f)})});
(async()=>{const sess=localStorage.getItem('clara-session');if(sess){try{const u=JSON.parse(sess);const check=await supa(`usuarios?id=eq.${u.id}&ativo=eq.true&select=*`);if(check&&check.length){const fresh=check[0];currentUser={id:fresh.id,name:fresh.nome,email:fresh.email,role:fresh.role,cargo:fresh.cargo,avatar:fresh.avatar};localStorage.setItem('clara-session',JSON.stringify(currentUser));launchApp(currentUser)}else{localStorage.removeItem('clara-session')}}catch{localStorage.removeItem('clara-session')}}})();
</script>
</body>
</html>
