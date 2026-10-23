# GiftMagzz — complete frontend + backend

## Features
- Royal black, white and blue responsive website.
- Signup/sign-in using email, mobile number at signup, and password.
- SQLite database created automatically for users and orders.
- JWT-protected order API and password hashing.
- Packages: 8 pages ₹700; 12 pages ₹800; 16 pages ₹900; 20 pages ₹1,000.
- Themes: Swathi Magazine, Anniversary, Birthday, Friends, Rakhi, Memories, Farewell, Father’s Day, Couple, Valentines, You & Me.
- Shipping ₹150 PAN India; no COD; 50% advance and 50% after final preview.
- WhatsApp handoff after an order is saved.

## Start backend (PowerShell)
Open a terminal and enter the folder `giftmagzz-backend`, then run:
```powershell
Copy-Item .env.example .env
npm install
npm start
```
Test `http://localhost:5000/api/health`. Expected JSON: `{"ok":true,"service":"GiftMagzz API"}`.
Keep this terminal running. The SQLite database is created automatically under `giftmagzz-backend/data/`.

## Start frontend
Open a second terminal and enter `giftmagzz-frontend`:
```powershell
npx serve .
```
Open the URL printed in the terminal. For VS Code Live Server, add its exact origin to `FRONTEND_ORIGIN` in backend `.env` and restart backend.

## Configure WhatsApp
Open `giftmagzz-frontend/app.js` and set `WHATSAPP_NUMBER` to your business number with country code and digits only, e.g. `919876543210`. Do not use the example number; replace it with your real business number.

## Important
- Signup uses name, email, mobile and password; login currently uses email and password (mobile-number login is not implemented).
- This project saves order requests but does not process payments or mark payments as completed.
- Before deployment, set a strong random `JWT_SECRET`, `NODE_ENV=production`, and the correct `FRONTEND_ORIGIN`.
- SQLite is good for local testing; production hosting with ephemeral disks or multiple instances should use a managed persistent database.
- Native dependency `better-sqlite3` may need a supported Node.js LTS release (Node 20/22 recommended) if npm installation fails.
