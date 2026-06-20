# Connecting econ-growth.com to Netlify

Follow these steps to point your domain to the live site. Takes about 10 minutes to set up, then 1–2 hours for DNS to fully propagate.

---

## Step 1 — Add your domain in Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and open your site
2. Click **Domain management** in the left sidebar
3. Click **Add a domain**
4. Type `econ-growth.com` and confirm
5. Netlify will show you a set of nameserver addresses — copy all four, they look like:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

---

## Step 2 — Update nameservers at your registrar

Log in to wherever you bought `econ-growth.com` (GoDaddy, Namecheap, Google Domains, etc.) and find the **Nameservers** or **DNS** settings.

Replace the existing nameservers with the four Netlify provided.

> **Note:** Changing nameservers hands DNS control to Netlify. Any existing DNS records (email, subdomains) will need to be re-added in Netlify's DNS panel if you have them.

---

## Step 3 — Wait for propagation

DNS changes take anywhere from 15 minutes to 2 hours to go live worldwide. You can check status at [dnschecker.org](https://dnschecker.org) — search for `econ-growth.com` and watch for it to resolve.

Netlify automatically provisions a free SSL certificate (HTTPS) once DNS is confirmed. No action needed on your end.

---

## Step 4 — Verify in Netlify

Back in **Domain management**, Netlify will show a green checkmark next to `econ-growth.com` once everything is connected. Both `econ-growth.com` and `www.econ-growth.com` will work automatically.

---

## Already have something at econ-growth.com?

If the domain is currently pointing to another site, switching nameservers will replace it. Make sure you have a copy of any existing DNS records before making changes.

---

## Need help?

Netlify support: [docs.netlify.com/domains](https://docs.netlify.com/domains-https/custom-domains/)
