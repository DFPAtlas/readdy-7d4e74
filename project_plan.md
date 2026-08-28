# DFP Freelancer Network

## 1. Project Description
A secure freelancer portal for Digital Footprint. Approved freelancers use this portal to find DFP work, accept assignments, submit work, record time, raise invoices, and communicate with DFP staff. Phase 1 creates the technical foundation: authentication, role structure, onboarding, profile management, document uploads, admin review, and the core portal shell.

**Target Users:** Freelancers (pending and approved), DFP admins, project managers, finance staff
**Core Value:** Streamlined, secure freelancer onboarding and management for Digital Footprint's contractor network

## 2. Page Structure

### Public Pages
- `/` - Public Landing Page
- `/login` - Freelancer Login
- `/register` - Freelancer Registration
- `/forgot-password` - Password Recovery
- `/reset-password` - Password Reset
- `/verify-email` - Email Verification
- `/auth/callback` - Auth Callback Handler
- `/application-under-review` - Application Status
- `/account-suspended` - Suspended Account
- `/unauthorised` - Unauthorised Access
- `/privacy` - Privacy Notice
- `/freelancer-terms` - Freelancer Terms
- `/security` - Security Information
- `/faq` - FAQ

### Freelancer Portal (Protected)
- `/portal` - Freelancer Dashboard
- `/portal/application` - Onboarding Wizard
- `/portal/profile` - Profile Management
- `/portal/skills` - Skills Management
- `/portal/portfolio` - Portfolio Management
- `/portal/documents` - Document Upload
- `/portal/agreements` - Agreements
- `/portal/security` - Security Settings
- `/portal/support` - Support
- `/portal/coming-soon/[module]` - Future Module Placeholders

### Admin Portal (Protected)
- `/admin` - Admin Dashboard
- `/admin/applications` - Application List
- `/admin/applications/[id]` - Application Detail
- `/admin/freelancers` - Freelancer List
- `/admin/documents` - Document Review
- `/admin/compliance` - Compliance Overview
- `/admin/audit-log` - Audit Log
- `/admin/settings` - Portal Settings

## 3. Core Features
- [x] Public landing page with all required sections
- [x] Supabase authentication (register, login, logout, password reset, email verification)
- [x] Role-based access (super_admin, dfp_admin, project_manager, finance, freelancer, pending_freelancer)
- [x] Protected route system with server-side validation
- [x] Freelancer portal shell with responsive sidebar navigation
- [x] Admin portal shell with responsive sidebar navigation
- [x] Pending freelancer dashboard with onboarding checklist
- [x] Approved freelancer dashboard shell
- [x] Multi-step onboarding wizard with autosave (8 steps)
- [x] Profile management (view and edit, profile photo upload)
- [x] Skills and portfolio management
- [x] Private document upload with Supabase Storage and signed URL downloads
- [x] Admin application review (list, detail, approve, reject, request info)
- [x] Admin dashboard with real database counts
- [x] Audit logging for all critical actions
- [x] Coming-soon placeholders for future modules (with phase information)

## 4. Data Model Design

### Table: profiles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | References auth.users |
| email | text | User email |
| first_name | text | First name |
| last_name | text | Last name |
| role | text | User role (pending_freelancer, freelancer, etc.) |
| account_status | text | active, suspended, etc. |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

### Table: freelancer_profiles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| preferred_name | text | Preferred name |
| telephone | text | Phone number |
| country | text | Country |
| city_region | text | City or region |
| timezone | text | Timezone |
| languages | jsonb | Array of languages |
| profile_photo_url | text | Profile photo URL |
| bio | text | Professional summary |
| primary_category | text | Primary freelancer category |
| experience_years | integer | Years of experience |
| experience_level | text | junior, mid, senior, lead |
| tools_platforms | jsonb | Tools and platforms |
| certifications | jsonb | Certifications |
| preferred_project_types | jsonb | Preferred project types |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_business_details
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| business_type | text | freelancer, sole_trader, limited_company, partnership, other |
| trading_name | text | Trading name |
| company_name | text | Registered company name |
| company_number | text | Company registration number |
| vat_registered | boolean | VAT registered |
| vat_number | text | VAT number |
| business_address | jsonb | Address object |
| website | text | Website URL |
| professional_profile_url | text | LinkedIn or similar |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_skills
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| category | text | Skill category |
| skills | jsonb | Array of skill tags |
| additional_categories | jsonb | Additional categories |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_portfolio_items
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| title | text | Portfolio item title |
| description | text | Description |
| project_type | text | Project type |
| skills_used | jsonb | Skills applied |
| url | text | Project URL |
| image_url | text | Optional image |
| document_id | uuid FK nullable | Optional document reference |
| sort_order | integer | Display order |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_availability
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| availability_status | text | available, limited, unavailable |
| hours_per_week | integer | Hours available |
| preferred_days | jsonb | Working days |
| earliest_start_date | date | Earliest start |
| remote_preference | text | remote, on_site, hybrid |
| travel_available | boolean | Travel availability |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_rates
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| hourly_rate | numeric | Hourly rate |
| day_rate | numeric | Day rate |
| fixed_price_accepted | boolean | Accepts fixed price |
| currency | text | Currency code |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_documents
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| category | text | CV, identification, certificate, etc. |
| file_name | text | Original file name |
| file_path | text | Storage path |
| file_size | integer | File size in bytes |
| file_type | text | MIME type |
| review_status | text | unreviewed, approved, rejected |
| reviewed_by | uuid FK nullable | Admin reviewer |
| reviewed_at | timestamptz nullable | Review timestamp |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz nullable | Soft delete |

### Table: freelancer_applications
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| status | text | draft, submitted, under_review, more_info, approved, rejected, suspended |
| profile_completion | integer | 0-100 |
| submitted_at | timestamptz nullable | Submission date |
| reviewed_by | uuid FK nullable | Reviewer |
| approved_at | timestamptz nullable | Approval date |
| rejected_at | timestamptz nullable | Rejection date |
| rejection_reason | text nullable | Reason for rejection |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_application_events
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| application_id | uuid FK | References freelancer_applications |
| actor_id | uuid FK | Who performed the action |
| event_type | text | submitted, reviewed, approved, etc. |
| previous_status | text nullable | Previous status |
| new_status | text | New status |
| note | text nullable | Admin note |
| created_at | timestamptz | |

### Table: freelancer_agreements
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| agreement_type | text | privacy_notice, freelancer_terms, nda, contractor_agreement, security_induction |
| accepted | boolean | Acceptance status |
| accepted_at | timestamptz nullable | Acceptance date |
| version | text | Agreement version |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_internal_notes
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| freelancer_id | uuid FK | References profiles.id |
| author_id | uuid FK | Admin who wrote the note |
| content | text | Note content |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: freelancer_notifications
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| user_id | uuid FK | References profiles.id |
| type | text | Notification type |
| title | text | Title |
| message | text | Message body |
| read | boolean | Read status |
| action_url | text nullable | Link target |
| created_at | timestamptz | |

### Table: audit_logs
| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| actor_id | uuid FK nullable | Who performed action |
| action | text | Action name |
| entity_type | text | Entity type |
| entity_id | uuid nullable | Entity identifier |
| previous_value | jsonb nullable | Before state |
| new_value | jsonb nullable | After state |
| created_at | timestamptz | |

## 5. Backend / Third-party Integration Plan
- **Supabase Auth**: Email/password authentication, email verification, password reset
- **Supabase PostgreSQL**: All application data storage with RLS
- **Supabase Storage**: Private document storage with signed URLs
- **Supabase Edge Functions**: Server-side operations (admin actions, sensitive mutations)
- **Resend (future)**: Email notifications (Phase 2+)
- **Stripe (future)**: Freelancer payments (Phase 3+)

## 6. Development Phase Plan

### Phase 1a: Foundation Setup & Authentication ✅ COMPLETE
- Goal: Set up Supabase connection, database schema, RLS, and full authentication flow
- Deliverable: Working auth (register, login, logout, password reset, email verification), database tables with RLS, route protection structure
- Pages: Login, Register, Forgot Password, Reset Password, Verify Email, Auth Callback ✅
- Database: All 14 tables created with RLS policies and audit logging ✅

### Phase 1b: Public Landing Page ✅ COMPLETE
- Goal: Create the public-facing freelancer network landing page
- Deliverable: Complete landing page with all sections (Hero, How It Works, Categories, Security, Why DFP, FAQ, Footer)
- Pages: Home (/), Privacy, Freelancer Terms, Security, FAQ ✅
- Components: Navbar (transparent→fixed on scroll), HeroSection, HowItWorks, Categories, SecuritySection, WhyDFP, FAQPreview, Footer ✅

### Phase 1c: Freelancer Portal Shell & Onboarding ✅ COMPLETE
- Goal: Build protected portal layout, pending freelancer dashboard, and multi-step onboarding wizard
- Deliverable: Portal sidebar navigation, pending/approved dashboard, 8-step onboarding with autosave
- Components: PortalLayout (sidebar + topbar + mobile), FreelancerDashboard (pending checklist + approved shell), ApplicationWizard (8 steps), Step1-8 components, ComingSoon placeholder ✅
- Pages: /portal, /portal/dashboard, /portal/application, /portal/profile, /portal/skills, /portal/portfolio, /portal/documents, /portal/agreements, /portal/security, /portal/support, /portal/coming-soon/:module ✅

### Phase 1d: Admin Portal & Approval Flow ✅ COMPLETE
- Goal: Build admin dashboard, application review system, and approval workflow
- Deliverable: Admin dashboard with real counts, application list/filter, application detail, approval/rejection flow, internal notes, audit logging
- Components: PortalLayout (reused for admin), AdminDashboard (6 stat cards + recent apps), ApplicationsList (search/filter/pagination), ApplicationDetail (full profile review + 5 action buttons + internal notes), ComingSoon admin pages ✅
- Pages: /admin, /admin/applications, /admin/applications/:id, /admin/freelancers, /admin/documents, /admin/compliance, /admin/audit-log, /admin/settings ✅

### Phase 1e: Document Upload, Profile & Polish ✅ COMPLETE
- Goal: Complete document upload foundation, profile management, coming-soon pages, and final polish
- Deliverable: Private document upload with Supabase Storage, signed URL downloads, profile photo upload, polished coming-soon pages, updated portal layout
- Storage Buckets: freelancer-documents (10MB, PDF/DOC/DOCX/JPG/PNG), freelancer-avatars (5MB, JPG/PNG/WebP) ✅
- RLS: Full storage RLS on both buckets — users see and upload only their own files, admins have full SELECT access ✅
- Pages completed: /portal/documents (full doc browser with upload/download/filter), /portal/profile (photo upload + profile editing), /portal/coming-soon/[module] (polished with phase info), admin coming-soon pages (polished with planned features) ✅

### Phase 2: Work Marketplace & Assignments ✅ COMPLETE
- Goal: Build the work opportunities marketplace, freelancer application flow, invitations, offers, and assignment creation
- Deliverable: Full marketplace workflow — browse opportunities, apply, staff review applications, send invitations/offers, create and manage assignments
- Database: 6 new tables (work_opportunities, opportunity_applications, freelancer_invitations, assignment_offers, assignments, assignment_access) with full RLS
- Freelancer Pages:
  - /portal/opportunities ✅ — Published opportunities list with search, category/engagement filters, priority badges, skill tags
  - /portal/opportunities/:id ✅ — Full opportunity detail with description, skills, deliverables, and apply workflow with cover letter + rate proposal
  - /portal/applications ✅ — My applications list with status filters and reviewer feedback
  - /portal/assignments ✅ — Active assignments list with status badges and remaining days
  - /portal/assignments/:id ✅ — Assignment detail with Overview tab, scope, deliverables, milestones, agreements, and phase previews for Tasks/Files/Messages/Submissions/Activity
- Admin Pages:
  - /admin/opportunities ✅ — Opportunities table with status/priority filters and create button
  - /admin/opportunities/new ✅ — Full creation form with all fields (title, description, category, budget, skills, deliverables, dates, status)
  - /admin/opportunities/:id ✅ — Edit/manage opportunity with status change actions (draft → published → closed → filled → cancelled)
  - /admin/opportunity-applications ✅ — Review all freelancer applications with status actions (start review, shortlist, accept, decline)
  - /admin/invitations ✅ — Invitations & Offers management with tab switcher
  - /admin/assignments ✅ — Assignments table with status filter and inline creation form (assign to freelancer by email)
  - /admin/assignments/:id ✅ — Assignment detail with status management, freelancer info, deliverables/milestones previews
- Dashboard Updates:
  - Freelancer dashboard now shows real counts for opportunities, applications, active assignments (was "coming soon")
  - Admin dashboard now shows published opportunities, opportunity applications, and active assignments counts
  - Admin sidebar updated with 4 new Phase 2 nav items
  - Freelancer sidebar updated with clickable marketplace links (replacing "coming soon" placeholders)
- Seed Data: 6 realistic UK government-sector work opportunities with varying categories, rates, and priorities

### Phase 3: Assignment Delivery & Collaboration ✅ COMPLETE
- Goal: Build the complete assignment delivery workflow — tasks, milestones, messaging, submissions, reviews, change requests, activity tracking
- Deliverable: Full collaboration system inside assignments with real-time data, review workflows, and complete audit trail
- Database: 7 new tables (assignment_tasks, assignment_milestones, assignment_messages, work_submissions, submission_reviews, change_requests, assignment_activity_log) with full RLS
- Tab Components (shared between freelancer and admin):
  - TasksTab ✅ — Task CRUD, drag-and-drop status changes (pending→in_progress→blocked→done→cancelled), priority badges, filter pills, progress bar, checkbox completion toggle
  - MilestonesTab ✅ — Milestone CRUD with due dates and amounts, sequential numbering, status management (pending→in_progress→completed→approved→cancelled), invoice-eligible marking
  - MessagesTab ✅ — Real-time chat between freelancer and PM, auto-scroll, timestamps, "You" vs "PM" sender labels, green bubbles for your messages, system message styling
  - SubmissionsTab ✅ — Submit work for review (title, type, description), staff approve/reject/request-changes workflow with star rating, reviewer notes, changes-requested display, draft→submitted→under_review→approved lifecycle
  - ActivityTab ✅ — Timeline view of all assignment events, color-coded activity icons (tasks blue, milestones amber, submissions green/red, messages stone), relative timestamps (just now, 5m ago, 3h ago, 2d ago)
- Freelancer Assignment Detail:
  - 6 tabs: Overview, Tasks, Milestones, Messages, Submissions, Activity — all fully functional
  - Freelancers can: view/create/complete tasks, view milestones, chat with PM, submit work for review, track activity
  - Phased sidebar: Messages removed from coming-soon (now embedded in assignments), Timesheets and Invoices still in Phase 4
- Admin Assignment Detail:
  - Same 6 tabs with full staff access — create/manage tasks and milestones, review submissions, chat with freelancers, monitor activity
  - Status management bar preserved (pending_setup→ready_to_start→in_progress→paused→approved→completed→cancelled)
- Dashboard Updates:
  - Admin dashboard: 2 new stat cards (Total Tasks, Pending Submissions), grid expanded to 10 cards in 5 columns
  - Freelancer dashboard: Phase notice updated to reflect Phase 3 completion
- Router: No new routes needed — all Phase 3 features are embedded within existing assignment detail pages
- RLS: Full row-level security on all 7 new tables — freelancers see only their own assignment data, staff have full access, messages restrict insert to sender

### Phase 4: Timesheets, Invoicing & Payments ✅ COMPLETE
- Goal: Build the complete financial workflow — timesheets, invoices, payments, credit notes, and earnings dashboard
- Deliverable: Full financial management for freelancers and DFP finance staff
- Database: 6 new tables (timesheets, time_entries, invoices, invoice_items, payments, credit_notes) with full RLS
- Freelancer Pages:
  - /portal/timesheets ✅ — Timesheets list with status filters, summary cards (total hours, billable hours, total value, approved count), and "New Timesheet" button
  - /portal/timesheets/new ✅ — Create form with assignment selector, week period picker, 5-row time entry grid (day, date, description, hours, billable toggle), add/remove rows, auto-calculated totals, save draft or submit
  - /portal/timesheets/:id ✅ — Detail view showing period, rate info, time entries grouped by date with billable badges, submit for approval button, review notes display
  - /portal/invoices ✅ — Invoice list with status filters (issued, part_paid, paid, overdue), summary cards (outstanding, total paid), urgent indicators, earnings dashboard link
  - /portal/invoices/:id ✅ — Full invoice detail with line items table (description, qty, rate, amount), subtotal/VAT/total/balance calculations, payment history, credit notes, due date tracking
  - /portal/earnings ✅ — Earnings dashboard with 6 KPI cards (total billed, paid, outstanding, hours, invoice count, paid count), monthly bar chart breakdown, quick links to invoices/timesheets
- Admin Pages:
  - /admin/timesheets ✅ — All timesheets table with status filters, freelancer info, pending review count, approved hours/value, click-through to review
  - /admin/timesheets/:id ✅ — Full review page with start review/approve/reject actions, review notes, time entries grouped by date with billable indicators
  - /admin/invoices ✅ — Invoice management table with status filters, summary cards (outstanding, collected), urgent indicators, link to payments
  - /admin/invoices/:id ✅ — Invoice detail with line items, record payment form (amount, method, reference, date), payment history, credit notes, cancel invoice action, auto-status updates (paid/part_paid)
  - /admin/payments ✅ — Payment records grouped by month, summary cards (total payments, received, average), linked to invoice details
- Sidebar Updates:
  - Freelancer sidebar: Timesheets and Invoices changed from coming-soon placeholders to active links
  - Admin sidebar: Timesheets, Invoices, and Payments added as new nav items
  - Assignment detail: Phase 4 teaser removed, sidebar updated with active Timesheets/Invoices links
- Dashboard Updates:
  - Admin dashboard: 14 stat cards in 7-column grid, added Pending Timesheets, Open Invoices, Total Payments, Revenue
  - Freelancer dashboard: Phase notice updated to "Phase 4 is now live — All systems operational"
- Router: 11 new routes added (6 freelancer + 5 admin)