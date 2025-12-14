# GateKeeperPro Developer Portal

A modern developer portal for managing OTP projects and API integrations.

## Features

- 🔐 **Authentication** - Secure login and registration
- 📊 **Dashboard** - Overview of your projects and usage
- 🚀 **Projects** - Manage OTP projects and API keys
- 🛒 **Checkout** - Create online checkout sessions
- 📈 **Analytics** - Track OTP success rates and usage
- 📝 **Logs** - View audit logs and OTP records
- 💳 **Billing** - Manage credits and payments

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3002](http://localhost:3002)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** React Icons

## Project Structure

```
gate_keeper_portal/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   └── globals.css
├── components/
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── lib/
│   ├── api.ts           # API client
│   ├── auth.tsx         # Auth context
│   └── utils.ts         # Utilities
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server (port 3002)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

The portal connects to the GateKeeperPro API:

- **Auth:** `/api/account/login`, `/api/account/register`
- **Projects:** `/api/project/list`, `/api/project/create`
- **Checkout:** `/api/checkout/create`
- **OTP:** `/api/project/otp_records`

## Next Steps

- [ ] Complete projects page with create/edit/delete
- [ ] Add checkout session builder
- [ ] Implement analytics dashboard
- [ ] Add logs filtering and search
- [ ] Integrate billing and payments
- [ ] Create API documentation page
- [ ] Add settings page

## License

Private - GateKeeperPro
