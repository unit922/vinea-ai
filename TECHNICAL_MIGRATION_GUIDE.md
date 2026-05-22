# Vinetelligence Migration & Maintenance Guide

This document outlines how to transfer the **Vinetelligence** platform to a professional production environment and how to manage content updates (Blog, Case Studies) effectively.

## 1. Hosting Options (Production)

### Option A: Vercel (Recommended)
Since this is a React/Vite application, Vercel provides the most seamless experience with automatic SSL, global CDN, and "Deploy on Push" functionality.
1. **Export:** Use the "Export to GitHub" feature in AI Studio.
2. **Import:** Log in to [Vercel](https://vercel.com), click "Add New Project," and select your GitHub repository.
3. **Configure:** Add your environment variables (Firebase keys, etc.) in the Vercel dashboard.

### Option B: Netlify
Another excellent choice for frontend-heavy applications.
1. Connect GitHub repo.
2. Build Command: `npm run build`
3. Publish Directory: `dist`

---

## 2. Managing Content (The Blog & Case Studies)

To update the blog or case studies without touching the code, we recommend a **Headless CMS**.

### Choice: Sanity.io or Contentful
1. **Setup:** Create a free account on Sanity.io.
2. **Schema:** Define a `Post` type with fields: `title`, `excerpt`, `content`, `date`.
3. **Integration:** 
   - Replace the static data in `BlogSection.tsx` with a `useEffect` hook that calls the Sanity API.
   - We can implement this for you before you export.

---

## 3. Maintenance via AI Studio

You can continue maintaining the site right here! Even after you export, you can return to AI Studio to:
*   **Design New Sections:** "Add a module for Client Feedback."
*   **Update Brand Voice:** "Make the terminology more focused on Enterprise Scaling."
*   **Fix Layouts:** "Adjust the mobile padding on the Hero section."

---

## 4. Technical Stack Summary
*   **Framework:** React 18+ (Vite)
*   **Styling:** Tailwind CSS (Utility-first)
*   **Animations:** Motion/React (formerly Framer Motion)
*   **Database:** Firebase Firestore
*   **Authentication:** Firebase Auth (Google Login)

For strategic support, contact: **business@vinetelligence.live**
