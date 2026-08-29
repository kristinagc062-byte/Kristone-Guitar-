# KRISTONE GUITARS — Cash on Delivery Funnel

A production-ready product funnel for the Kristone Premium Acoustic Guitar: landing page, checkout, order API, Google Sheets storage, two HTML email notifications, and thank-you page.

## Recommended stack

- Next.js App Router, TypeScript, Tailwind CSS, and reusable React components
- Google Sheets API with a service account for order storage
- Resend's HTTPS email API for reliable server-side delivery to the business Gmail address and the customer
- Vercel for production hosting

The order API validates all customer and product data on the server. It calculates the accepted price from the product configuration rather than trusting a browser-supplied price.

## Order flow

1. A customer selects a quantity and opens `/checkout`.
2. The checkout page automatically supplies the product name, unit price, quantity, and total.
3. `POST /api/order` validates every field, generates a unique order ID, timestamp, `Cash On Delivery` payment method, and `New Order` status.
4. The API appends the order to Google Sheets.
5. After the row is saved, the API sends a professional HTML notification to the business and an order-received email to the customer.
6. Only after all required operations succeed does the customer reach `/thank-you`.

The Order Now button is disabled while submitting. Errors remain on the checkout page and are shown clearly.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values below.
3. Start with `npm run dev`.
4. Open `http://localhost:3000`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Final public website URL, such as `https://your-domain.com` |
| `BUSINESS_EMAIL` | Receives new-order notifications (`digitalbykristina@gmail.com`) |
| `EMAIL_FROM` | Verified sender, such as `KRISTONE GUITARS <orders@your-domain.com>` |
| `EMAIL_REPLY_TO` | Reply/contact address shown to customers |
| `BRAND_NAME` | Brand used in both emails |
| `GOOGLE_SHEET_ID` | ID from the Google Sheet URL |
| `GOOGLE_SHEET_TAB_NAME` | `Orders` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account `client_email` |
| `GOOGLE_PRIVATE_KEY` | Service account `private_key`, including `BEGIN/END` lines; escaped `\n` is supported |
| `EMAIL_SERVICE_API_KEY` | Resend API key |
| `FRONTEND_URL` | Exact allowed production origin, such as `https://your-domain.com` |

The SMTP variables are included in `.env.example` for an optional future Gmail SMTP adapter. The current implementation uses Resend over HTTPS, which is portable across serverless hosts. `BUSINESS_EMAIL` and `EMAIL_REPLY_TO` can remain Gmail addresses. Resend requires `EMAIL_FROM` to use a sender/domain verified in your Resend account.

Never commit `.env.local` or paste secrets into frontend files.

## Google Sheet setup

1. Create a Google Cloud project, for example **Coconut Orders**.
2. Under **APIs & Services → Library**, enable **Google Sheets API** and **Google Drive API**.
3. Under **IAM & Admin → Service Accounts**, create a service account.
4. Create a JSON key. Copy `client_email` to `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` to `GOOGLE_PRIVATE_KEY`.
5. Create a Google Spreadsheet and rename its first tab to **Orders**.
6. Put these headings in row 1, columns A–M, in this exact order:

   `Order ID`, `Date & Time`, `Customer Name`, `Phone Number`, `Email Address`, `Exact Location`, `Product Name`, `Quantity`, `Price Per Piece`, `Total Price`, `Payment Method`, `Order Status`, `Notes`

7. Share the spreadsheet with the service account email as an **Editor**.
8. Copy the value between `/d/` and `/edit` in the spreadsheet URL into `GOOGLE_SHEET_ID`.
9. Select row 1 and choose **Data → Create a filter**. Freeze row 1 for easier order management.
10. Select column L from row 2 downward, choose **Data → Data validation → Dropdown**, and add: `New Order`, `Order Confirmed`, `Order Ongoing`, `Delivered`, `Cancelled`.

The API writes raw cell values and keeps all credentials server-side.

## Email setup

1. Create a Resend account and verify a sending domain.
2. Create an API key and save it as `EMAIL_SERVICE_API_KEY`.
3. Set `EMAIL_FROM` to a verified sender on that domain.
4. Keep `BUSINESS_EMAIL` and `EMAIL_REPLY_TO` as `digitalbykristina@gmail.com` if desired.

Two responsive, Gmail-compatible HTML emails are generated for every successful order: a detailed business notification and a friendly customer confirmation.

## Test the complete order submission

1. Add all Google and email variables to `.env.local`, then restart the development server.
2. Place an order with an email address you can check.
3. Confirm that exactly one new row appears in the `Orders` sheet with a unique order ID and `New Order` status.
4. Confirm the business Gmail inbox receives the new-order email.
5. Confirm the customer inbox receives the order-received email.
6. Confirm the browser reaches the thank-you page and displays the same product, quantity, and total.

To test failures, temporarily remove one required credential and verify that checkout shows an error and does not redirect. Restore it before production use.

## Deploy to Vercel

1. Push the project to a Git provider and import it in Vercel, or run the Vercel CLI from this directory.
2. Add every value from `.env.example` under **Project Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` and `FRONTEND_URL` to the final HTTPS site origin, without a trailing slash.
4. Deploy, then perform the complete order test above on the production domain.
5. If you add or change environment variables, redeploy so the server functions receive them.

## Editing product details

Core price and product data live in `lib/product.ts`. Landing-page content is in `components/landing-page.tsx`; checkout and confirmation content are separated into their own components. Replace the demo testimonials with verified reviews before launch.
