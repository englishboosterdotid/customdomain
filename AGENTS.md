<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Platform name: Toeflynk
Business Model:
- Creator can sell TOEFL simulations.
- Creator can sell digital products
- Creator can sell products from other creator
- Creator gets 100% revenue minus platform fees based on tier.
- Platform owns TOEFL engine.
- Platform owns question packages.
- Platform owns scoring system.
- Platform owns certificate system.
- Payment gateway (Midtrans)
- Creator tier premium features
user owns:
- Branding
- Pricing
- Bonuses
- Audience
Buyer Flow:
Microsite
→ Product
→ Product Detail
→ Checkout (Guest Checkout)
→ Payment
→ Credit Granted
→ Start TOEFL
→ Submit TOEFL
→ Score
→ Certificate
Creator Flow:
Register
→ Microsite Created /username
→ Microsite Settings
→ Activate TOEFL Product
→ Set Price
→ Share Link
→ Earn Revenue
==================================================
DOMAINS
==================================================
Identity
Microsite (link-in-bio + product showcase)
Commerce
Credits
Wallet
Assessment
Certificate
CRITICAL INVARIANTS
Wallet:
- Wallet uses ledger.
- Never store mutable balance.
- Balance must be derived from transactions.
Credits:
- Credits use ledger.
- Credit balance can never be negative.
- 1 TOEFL attempt consumes exactly 1 credit.
Orders:
- Paid orders are immutable.
- Paid orders can only be processed once.
Assessment:
- Every attempt must create a snapshot.
- Snapshots are immutable.
- Certificate can only be issued from a scored attempt.
- One attempt can only generate one certificate.
Certificates:
- Immutable.
- Publicly verifiable.
Creator:
- Creator is a role.
- Creator is always also a user.
- User can have multiple roles.
Catalog:
- Platform owns catalog products.
- Creator owns offerings.
- Creator owns products self
==================================================
ASSESSMENT RULES
Assessment uses Exam Package Engine.
- Listening 50 Questions (3 types = small talk, conversation, Long conversation)
- Structure 40 Questions (2 types fill in the blank, identity)
- Reading 50 Questions (only 1 type)
Attempts:
- Generate snapshot on start.
- Snapshot never changes.
==================================================
ENGINEERING RULES
==================================================
Always:
- Use TypeScript strict mode.
- Prefer explicit types.
- Write maintainable code.
- Follow domain-driven design principles.
- Separate route, service, repository.
- Keep business logic out of routes.
- Keep database access in repositories.
Never:
- Put SQL inside routes.
- Put business logic inside controllers.
- Use giant service files.
- Use mutable wallet balances.
- Use mutable credit balances.
# MULTI-TENANCY RULES
Microsite:
* toeflynk.com/username
Custom domain:
* userdomain.com
* no redirect
White-label:
* creator domain fully replaces platform branding

Mode 1
Microsite — path-based
toeflynk.com/demo
→ resolves to →
creator: demo
URL tetap toeflynk.com/demo. Next.js membaca segment pertama sebagai username creator dan merender microsite mereka. Tidak ada custom domain, tidak ada DNS setup dari creator.
Cara kerjanya
Next.js App Router:
/app/[username]/page.tsx
— catch semua path dengan username
Middleware cek: apakah username ada di DB? Jika tidak → 404
Render microsite creator sesuai branding mereka

Mode 2
Custom domain — tanpa redirect
usercustom.com
→ bukan redirect →
konten toeflynk.com/demo
User mengakses usercustom.com, browser tidak pernah melihat toeflynk.com. Konten di-serve langsung dari VPS dengan domain berbeda. Platform branding tetap muncul.
Cara kerjanya
Creator set CNAME:
usercustom.com → toeflynk.com
di DNS mereka
Cloudflare for SaaS (atau Nginx SNI) terima request
usercustom.com
Middleware Next.js baca
request.headers.host
→ lookup DB → resolve ke creator
SSL otomatis via Cloudflare for SaaS per custom domain

Mode 3
White-label — full brand replace
userwhite.com
→ zero toeflynk branding →
100% creator brand
Sama seperti Mode 2 dari sisi DNS dan routing, perbedaannya hanya di layer rendering. Middleware mendeteksi flag is_whitelabel = true dari DB, lalu menyembunyikan semua elemen branding Toeflynk.
Cara kerjanya
DNS dan routing identik dengan Mode 2
Middleware resolve creator → cek
plan.white_label = true
Context/flag diteruskan ke React — sembunyikan logo, footer, powered-by
Creator bisa upload logo sendiri, set warna brand

// middleware.ts — berjalan di setiap request
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') // "usercustom.com" atau "toeflynk.com"
  const pathname = request.nextUrl.pathname // "/demo" atau "/"

  if (host === 'toeflynk.com') {
    // Mode 1: path-based, ambil username dari URL
    const username = pathname.split('/')[1]
    // inject username ke header, lanjut normal
  } else {
    // Mode 2 & 3: custom domain
    // lookup DB: SELECT * FROM custom_domains WHERE domain = host
    // dapat creator_id → resolve microsite
    // cek white_label flag → inject ke header
  }
}

Satu catatan penting soal SSL untuk custom domain creator:
Ini satu-satunya bagian yang butuh keputusan infrastruktur sekarang. Ada dua opsi:
Opsi A — Cloudflare for SaaS (lebih mudah): creator cukup set CNAME ke toeflynk.com, Cloudflare yang urus SSL-nya otomatis per domain. Tapi ada biaya $0.10/domain/bulan setelah 100 domain gratis.
Opsi B — Caddy sebagai pengganti Nginx (gratis, lebih teknikal): Caddy bisa otomatis request SSL via Let's Encrypt untuk domain apapun yang masuk, tanpa konfigurasi manual. Lebih complex di awal tapi nol biaya per domain.
Untuk solo dev yang baru mulai, saya rekomendasikan mulai dengan Cloudflare for SaaS — 100 domain gratis sudah cukup untuk fase awal, dan kamu tidak perlu memikirkan SSL sama sekali.