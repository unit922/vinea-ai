# Vinetelligence DNS Configuration Guide

This guide documents the DNS settings required for the Vinetelligence application, specifically focusing on the integration between **Vercel** (Hosting/DNS) and **Namecheap** (Domain/Email).

## 1. DNS Authority Check
Before adding records, confirm where your DNS is managed:
*   **Vercel Nameservers:** If your domain uses `ns1.vercel-dns.com` etc., all records must be added in the **Vercel Dashboard**.
*   **Namecheap BasicDNS/AdvancedDNS:** If you point to Vercel via A records or CNAME, add records in the **Namecheap Advanced DNS** tab.

---

## 2. Manual DKIM Setup (Namecheap Private Email)
If Namecheap does not appear in the Vercel dropdown presets, use the manual **TXT Record** method.

### record Details
| Field | Value |
| :--- | :--- |
| **Type** | `TXT` |
| **Name (Host)** | `default._domainkey` (or as provided by Namecheap) |
| **Value** | `v=DKIM1; k=rsa; p=...[Your Long Key Here]...` |
| **TTL** | `3600` (or Default) |

### Steps in Vercel
1.  Navigate to **Project Settings > Domains**.
2.  Click **Edit** next to your domain and select **View DNS Records**.
3.  Add the `TXT` record manually using the host and value above.
4.  **Note:** Vercel automatically appends your domain name. If Namecheap gives you `default._domainkey.yourdomain.com`, only enter `default._domainkey` in the Name field.

---

## 3. Email Authentication Trio (SPF, DKIM, DMARC)
To ensure high deliverability and prevent "Spam" flags, ensure all three are present:

### SPF (Sender Policy Framework)
Usually a TXT record on the root `@`.
*   **Host:** `@`
*   **Value:** `v=spf1 include:spf.privateemail.com ~all` (Adjust if using a different provider).

### DMARC (Domain-based Message Authentication)
Tells servers what to do if SPF/DKIM fails.
*   **Host:** `_dmarc`
*   **Value:** `v=DMARC1; p=none; rua=mailto:admin@yourdomain.com`

---

## 4. Namecheap App Access (SRV Records)
If you are using Namecheap's Private Email features, ensure these SRV records are cloned into Vercel if Vercel is your DNS provider:
*   `_autodiscover._tcp`
*   `_caldav._tcp`
*   `_carddav._tcp`

---

## 5. Propagation Verification
DNS changes take time (usually 30 minutes to 24 hours). Use these tools to verify:
*   [Google Admin Toolbox Dig](https://toolbox.googleapps.com/apps/dig/)
*   [MXToolbox DKIM Lookup](https://mxtoolbox.com/dkim.aspx)
*   [WhatsMyDNS](https://www.whatsmydns.net/)
