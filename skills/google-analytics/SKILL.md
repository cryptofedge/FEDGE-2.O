---
name: google-analytics
description: >
  Website analytics and performance tracking using Google Analytics 4. Use when analyzing
  website traffic, tracking conversions, understanding audience behavior, or measuring
  marketing campaign performance. Triggers on phrases like "Google Analytics", "website
  traffic", "track conversions", "how is the website performing", "analytics report",
  "website data", "GA4", "track website visitors", "conversion tracking".
---

# Google Analytics 4 (GA4)

Google's free website analytics platform. Track visitors, behavior, and conversions.
URL: https://analytics.google.com

## Setup

1. Go to https://analytics.google.com
2. Create a property for your website
3. Add Google Tag (gtag.js) to your website
   - Shopify: Settings → Customer Events → add Google tag
   - Wix: Marketing Integrations → Google Analytics
4. Set up conversion events (purchases, form submissions, etc.)
5. Link to Google Ads for full attribution

---

## Key Reports

### 📊 Realtime
- See who's on your site RIGHT NOW
- Great to watch during campaigns and launches

### 👥 Audience
- Who visits: age, gender, location, language
- Device: mobile vs desktop vs tablet
- New vs returning visitors

### 📍 Acquisition
- Where traffic comes from:
  - Organic search (Google)
  - Social media (Instagram, TikTok)
  - Direct (typed URL)
  - Referral (other websites)
  - Paid (Google Ads, Meta Ads)
- Shows which marketing channels are working

### 📄 Engagement
- Most visited pages
- Average session duration
- Bounce rate (left without engaging)
- Scroll depth

### 💰 Conversions (E-Commerce)
- Revenue by channel
- Products purchased
- Cart abandonment rate
- Customer lifetime value

---

## Key Metrics to Track

| Metric | What It Means | Goal |
|--------|---------------|------|
| Sessions | Website visits | Growing MoM |
| Users | Unique visitors | Growing MoM |
| Bounce Rate | Left immediately | < 50% |
| Avg Session Duration | Time on site | > 2 minutes |
| Conversion Rate | Visitors who buy | > 2% |
| Revenue | Total sales | Growing |

---

## Use Cases for Éclat Universe

### mandoelpelado.com
- Track which songs/videos drive most traffic
- See where fans come from (Ecuador vs NYC vs other)
- Measure impact of social posts on website visits
- Track merch store conversions (if applicable)

### sensualmakeup.beauty (Shopify)
- Track which products get most views
- See which traffic source drives most sales
- Identify drop-off points in purchase funnel
- Measure email campaign traffic (Klaviyo UTMs)
- Track workshop booking conversions

---

## UTM Parameters (Campaign Tracking)

Add UTMs to links to track where traffic comes from:
```
https://sensualmakeup.beauty/products/eyeshadow
?utm_source=instagram
&utm_medium=social
&utm_campaign=spring_launch
```

Build UTM links free: https://ga-dev-tools.google.com/campaign-url-builder

Always use UTMs for:
- Instagram bio links
- Email campaigns
- Paid ad landing pages
- Influencer campaign links

## Key Link
https://analytics.google.com
