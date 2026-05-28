# Vinetelligence AI User Manual

## 1. Introduction
Vinetelligence is an 80% autonomous, AI-powered system for restaurant and beverage operations. It synthesizes hospitality expertise, predictive logistics, and guest intelligence to optimize your floor, staff, and inventory dynamically without requiring manual demo scheduling.

## 2. Onboarding & Setup
To begin using Vinetelligence, non-technical users, owners, and managers can quickly deploy:
- **Instant Operator Sandbox**: Explores the entire platform inside an preloaded establishment trial using local state persistence.
- **Venue Registration**: Allows you to connect your real hardware and software databases with secure PostgreSQL/Supabase cloud mirroring.

## 3. High-Value Portals & Core Modules
Vinetelligence integrates all key areas of modern service and business operations:
- **Dashboard**: Real-time operational pacing, zone monitoring, and high-level success signals.
- **AI Inventory**: Automated, camera-supported bin counts, cellar intelligence, and smart reorder forecasting.
- **Guest Journey & Profiles**: Track custom visitor palates, guest histories, and loyalty scores.
- **Bar Station & Sentinel**: A direct coaching interface for staff with mixology reference lookups.
- **Guest Outreach Desk (Omnichannel Dispatch)**: A centralized communications hub for organizing and broadcasting targeted marketing campaigns and auto-realigning guest notifications.
- **Connected Software Systems (Integration Hub)**: Link local systems such as QuickBooks and PMS services (e.g., Mews reservation workflows) to establish cohesive real-time data syncs.
- **Industry Trends Hub (Trend Intelligence)**: Access global industry aggregate insights, community drink trends, and predictive supply recommendations.
- **Operations & Facility Assets**: Assign tasks to active rosters, manage zones, and monitor live equipment telemetry.

## 4. UI Layout & App Switcher
To maintain streamlined navigation across various viewports:
- **Floating App Switcher & Comparison Dock**: A dynamic utility located at the page bottom. It is placed at `bottom-24 left-4 font-black` (rising to safe spacing on mobile, and floating at `md:left-[280px]` alongside the desktop sidebar) to ensure it **never** overlaps essential system options, such as the **Logout/Sign Out** action.
- **Sidebar & Mobile Navigation**: Quickly toggle between individual operational views, admin settings, and global ledgers.

## 5. Settings, Security & Override Rules
- **Profile Overrides**: Configure manual portal or public beverage menus via the admin screen.
- **Automatic RLS Node Protection**: Standard operations run safe Row-Level-Security protocols. Nodes created by administrators or general operators are safely synchronized across servers.
