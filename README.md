# Tic-Tac-Toe — AI + Real-Time Multiplayer

Three ways to play: pass-and-play locally, against a Minimax AI (with a
genuinely unbeatable difficulty), or online in real time with a friend.
Built to WCAG 2.1 AA — see [ACCESSIBILITY.md](./ACCESSIBILITY.md) for what
that means concretely, and [ARCHITECTURE.md](./ARCHITECTURE.md) for how the
AI and the multiplayer rooms actually work.

**[English](#english)** | **[العربية](#العربية)**

---

## English

### Game modes

- **Local 2-Player** — pass the device back and forth.
- **Player vs AI** — three difficulties: Easy (mostly random), Medium
  (depth-limited Minimax, beatable), Hard (full Minimax with alpha-beta
  pruning — provably unbeatable; the best you can force is a draw).
- **Online Multiplayer** — create a room, share the 5-character code (or
  the link), play in real time over Socket.io. Handles disconnects and
  reconnects, and a two-player rematch vote.

Local and vs-AI play entirely in the browser — no server required. Online
play needs the `/server` process running somewhere reachable.

### Tech stack

- **Client**: Next.js (App Router) + React + TypeScript + Tailwind CSS.
- **Server**: Node.js + Express + Socket.io.
- **Shared logic**: a `@ttt/game-core` workspace package — the win/draw
  rules, the Minimax AI, and the Socket.io event contract — imported by
  both, so the rules of the game exist in exactly one place.
- **Tests**: Vitest, covering the game logic and the AI (including a
  simulated-games test asserting hard difficulty never loses).

### Project structure

```
packages/game-core/   Pure game logic + AI + shared socket event types
client/                Next.js app
server/                Express + Socket.io room server
```

### Running locally

Requires Node.js 20+.

```bash
npm install                 # installs all three workspaces from the repo root
```

**Local play and vs-AI** need only the client:

```bash
npm run dev:client          # http://localhost:3000
```

**Online multiplayer** needs the server running too, in a second terminal:

```bash
npm run dev:server          # ws/http on http://localhost:4000
```

By default the client looks for the server at `http://localhost:4000`.
Copy `client/.env.local.example` to `client/.env.local` to change that
(e.g. once the server is deployed elsewhere). See `server/.env.example`
for the server's own `PORT` and `CLIENT_ORIGIN` settings.

### Testing

```bash
npm run test        # runs the game-core unit tests
npm run typecheck    # tsc --noEmit in every workspace
npm run lint         # eslint (client)
```

### Deploying

- **Client**: any static/Node host that runs Next.js — this project is set
  up for Vercel. Set `NEXT_PUBLIC_SOCKET_URL` to wherever the server ends up.
- **Server**: needs a host that keeps a persistent process alive (Render,
  Railway, Fly.io, a VM) — **not** Vercel's serverless functions, which
  can't hold a WebSocket connection open. See ARCHITECTURE.md for why.

---

## العربية

### أوضاع اللعب

- **لاعبان محليًا** — تبادل نفس الجهاز بين لاعبين.
- **لاعب ضد الذكاء الاصطناعي** — ثلاث مستويات صعوبة: سهل (حركات عشوائية
  في الأغلب)، متوسط (Minimax بعمق محدود، قابل للهزيمة)، صعب (Minimax كامل
  مع Alpha-Beta Pruning — لا يُهزم أبدًا، أقصى نتيجة ممكنة له هي التعادل).
- **لعب جماعي عبر الإنترنت** — إنشاء غرفة، مشاركة كود من 5 أحرف (أو
  الرابط المباشر)، واللعب بالوقت الفعلي عبر Socket.io، مع التعامل مع
  قطع/عودة الاتصال، وتصويت على إعادة اللعب يحتاج موافقة اللاعبين الاثنين.

وضعا "لاعبان محليًا" و"ضد الذكاء الاصطناعي" يعملان بالكامل داخل المتصفح
من غير أي حاجة للسيرفر. اللعب الجماعي عبر الإنترنت يحتاج تشغيل مجلد
`/server` على مكان يمكن الوصول إليه.

### التقنيات المستخدمة

- **العميل (Client)**: Next.js (App Router) + React + TypeScript +
  Tailwind CSS.
- **السيرفر**: Node.js + Express + Socket.io.
- **منطق مشترك**: حزمة `@ttt/game-core` — تحتوي على قواعد الفوز/التعادل،
  خوارزمية الذكاء الاصطناعي (Minimax)، وشكل رسائل Socket.io — تُستخدم من
  الـ client والـ server معًا، فمنطق اللعبة موجود في مكان واحد فقط.
- **الاختبارات**: Vitest، تغطي منطق اللعبة والذكاء الاصطناعي (بما فيها
  اختبار يحاكي عدة مباريات كاملة للتأكد إن المستوى الصعب لا يُهزم أبدًا).

### بنية المشروع

```
packages/game-core/   منطق اللعبة الأساسي + الذكاء الاصطناعي + شكل رسائل السوكيت المشتركة
client/                تطبيق Next.js
server/                سيرفر Express + Socket.io لإدارة الغرف
```

### التشغيل محليًا

يتطلب Node.js 20 أو أحدث.

```bash
npm install                 # يثبّت الحزم الثلاثة كلها من جذر المستودع
```

**اللعب المحلي وضد الذكاء الاصطناعي** يحتاجان الـ client فقط:

```bash
npm run dev:client          # http://localhost:3000
```

**اللعب الجماعي عبر الإنترنت** يحتاج تشغيل السيرفر كمان، في تيرمينال ثاني:

```bash
npm run dev:server          # على http://localhost:4000
```

الـ client بيدور افتراضيًا على السيرفر عند `http://localhost:4000`. لو
عايز تغيّر ده (بعد نشر السيرفر في مكان آخر مثلًا)، اعمل نسخة من
`client/.env.local.example` باسم `client/.env.local` وعدّل القيمة. شوف
`server/.env.example` لإعدادات `PORT` و`CLIENT_ORIGIN` بتاعة السيرفر.

### الاختبارات

```bash
npm run test        # اختبارات الوحدة لمنطق اللعبة
npm run typecheck    # فحص الأنواع في كل الحزم
npm run lint         # eslint (client)
```

### النشر (Deployment)

- **الـ client**: أي استضافة تدعم Next.js — المشروع جاهز للنشر على
  Vercel. حدّد `NEXT_PUBLIC_SOCKET_URL` لعنوان السيرفر بعد نشره.
- **السيرفر**: يحتاج استضافة تُبقي عملية (process) شغالة باستمرار
  (Render، Railway، Fly.io، أو VM) — **وليس** Vercel serverless functions،
  لأنها لا تدعم إبقاء اتصال WebSocket مفتوح. التفاصيل في
  [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## License

MIT — see [LICENSE](./LICENSE).
