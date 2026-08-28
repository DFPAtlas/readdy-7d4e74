import type { RouteObject } from 'react-router-dom';
import AuthGuard from '@/components/feature/AuthGuard';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/home/page';
import LoginPage from '@/pages/login/page';
import RegisterPage from '@/pages/register/page';
import ForgotPasswordPage from '@/pages/forgot-password/page';
import ResetPasswordPage from '@/pages/reset-password/page';
import VerifyEmailPage from '@/pages/verify-email/page';
import AuthCallbackPage from '@/pages/auth-callback/page';
import UnauthorisedPage from '@/pages/unauthorised/page';
import AccountSuspendedPage from '@/pages/account-suspended/page';
import ApplicationUnderReviewPage from '@/pages/application-under-review/page';
import PrivacyPage from '@/pages/privacy/page';
import FreelancerTermsPage from '@/pages/freelancer-terms/page';
import SecurityPage from '@/pages/security/page';
import FAQPage from '@/pages/faq/page';
import PortalPage from '@/pages/portal/page';
import FreelancerDashboard from '@/pages/portal/dashboard/page';
import ApplicationWizard from '@/pages/portal/application/page';
import ProfilePage from '@/pages/portal/profile/page';
import SkillsPage from '@/pages/portal/skills/page';
import PortfolioPage from '@/pages/portal/portfolio/page';
import DocumentsPage from '@/pages/portal/documents/page';
import AgreementsPage from '@/pages/portal/agreements/page';
import PortalSecurityPage from '@/pages/portal/security/page';
import SupportPage from '@/pages/portal/support/page';
import ComingSoonPage from '@/pages/portal/coming-soon/[module]/page';
import OpportunitiesPage from '@/pages/portal/opportunities/page';
import OpportunityDetailPage from '@/pages/portal/opportunities/[id]/page';
import ApplicationsPage from '@/pages/portal/applications/page';
import AssignmentsPage from '@/pages/portal/assignments/page';
import AssignmentDetailPage from '@/pages/portal/assignments/[id]/page';
import TimesheetsPage from '@/pages/portal/timesheets/page';
import NewTimesheetPage from '@/pages/portal/timesheets/new/page';
import TimesheetDetailPage from '@/pages/portal/timesheets/[id]/page';
import InvoicesPage from '@/pages/portal/invoices/page';
import InvoiceDetailPage from '@/pages/portal/invoices/[id]/page';
import EarningsPage from '@/pages/portal/earnings/page';
import AdminDashboard from '@/pages/admin/dashboard/page';
import ApplicationsList from '@/pages/admin/applications/page';
import ApplicationDetail from '@/pages/admin/applications/[id]/page';
import AdminOpportunities from '@/pages/admin/opportunities/page';
import AdminNewOpportunity from '@/pages/admin/opportunities/new/page';
import AdminOpportunityDetail from '@/pages/admin/opportunities/[id]/page';
import AdminOpportunityApplications from '@/pages/admin/opportunity-applications/page';
import AdminInvitations from '@/pages/admin/invitations/page';
import AdminAssignments from '@/pages/admin/assignments/page';
import AdminAssignmentDetail from '@/pages/admin/assignments/[id]/page';
import AdminTimesheets from '@/pages/admin/timesheets/page';
import AdminTimesheetDetail from '@/pages/admin/timesheets/[id]/page';
import AdminInvoices from '@/pages/admin/invoices/page';
import AdminInvoiceDetail from '@/pages/admin/invoices/[id]/page';
import AdminPayments from '@/pages/admin/payments/page';
import AdminFreelancers from '@/pages/admin/freelancers/page';
import AdminDocuments from '@/pages/admin/documents/page';
import AdminCompliance from '@/pages/admin/compliance/page';
import AdminAuditLog from '@/pages/admin/audit-log/page';
import AdminSettings from '@/pages/admin/settings/page';

const freelancerRoles = ['pending_freelancer', 'freelancer', 'super_admin', 'dfp_admin', 'project_manager', 'finance'];
const approvedFreelancerRoles = ['freelancer', 'super_admin', 'dfp_admin', 'project_manager', 'finance'];
const adminRoles = ['super_admin', 'dfp_admin', 'project_manager', 'finance'];

const routes: RouteObject[] = [
  // Public pages
  { path: '/', element: <Home /> },
  { path: '/login', element: <AuthGuard requireAuth={false}><LoginPage /></AuthGuard> },
  { path: '/register', element: <AuthGuard requireAuth={false}><RegisterPage /></AuthGuard> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/unauthorised', element: <UnauthorisedPage /> },
  { path: '/account-suspended', element: <AccountSuspendedPage /> },
  { path: '/application-under-review', element: <ApplicationUnderReviewPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/freelancer-terms', element: <FreelancerTermsPage /> },
  { path: '/security', element: <SecurityPage /> },
  { path: '/faq', element: <FAQPage /> },

  // Freelancer portal
  {
    path: '/portal',
    element: <AuthGuard allowedRoles={freelancerRoles}><PortalPage /></AuthGuard>,
  },
  {
    path: '/portal/dashboard',
    element: <AuthGuard allowedRoles={freelancerRoles}><FreelancerDashboard /></AuthGuard>,
  },
  {
    path: '/portal/application',
    element: <AuthGuard allowedRoles={['pending_freelancer']}><ApplicationWizard /></AuthGuard>,
  },
  {
    path: '/portal/profile',
    element: <AuthGuard allowedRoles={freelancerRoles}><ProfilePage /></AuthGuard>,
  },
  {
    path: '/portal/skills',
    element: <AuthGuard allowedRoles={freelancerRoles}><SkillsPage /></AuthGuard>,
  },
  {
    path: '/portal/portfolio',
    element: <AuthGuard allowedRoles={freelancerRoles}><PortfolioPage /></AuthGuard>,
  },
  {
    path: '/portal/documents',
    element: <AuthGuard allowedRoles={freelancerRoles}><DocumentsPage /></AuthGuard>,
  },
  {
    path: '/portal/agreements',
    element: <AuthGuard allowedRoles={freelancerRoles}><AgreementsPage /></AuthGuard>,
  },
  {
    path: '/portal/security',
    element: <AuthGuard allowedRoles={freelancerRoles}><PortalSecurityPage /></AuthGuard>,
  },
  {
    path: '/portal/support',
    element: <AuthGuard allowedRoles={freelancerRoles}><SupportPage /></AuthGuard>,
  },
  {
    path: '/portal/coming-soon/:module',
    element: <AuthGuard allowedRoles={freelancerRoles}><ComingSoonPage /></AuthGuard>,
  },

  // Phase 2 - Freelancer marketplace
  {
    path: '/portal/opportunities',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><OpportunitiesPage /></AuthGuard>,
  },
  {
    path: '/portal/opportunities/:id',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><OpportunityDetailPage /></AuthGuard>,
  },
  {
    path: '/portal/applications',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><ApplicationsPage /></AuthGuard>,
  },
  {
    path: '/portal/assignments',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><AssignmentsPage /></AuthGuard>,
  },
  {
    path: '/portal/assignments/:id',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><AssignmentDetailPage /></AuthGuard>,
  },

  // Phase 4 - Timesheets, Invoices, Earnings
  {
    path: '/portal/timesheets',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><TimesheetsPage /></AuthGuard>,
  },
  {
    path: '/portal/timesheets/new',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><NewTimesheetPage /></AuthGuard>,
  },
  {
    path: '/portal/timesheets/:id',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><TimesheetDetailPage /></AuthGuard>,
  },
  {
    path: '/portal/invoices',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><InvoicesPage /></AuthGuard>,
  },
  {
    path: '/portal/invoices/:id',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><InvoiceDetailPage /></AuthGuard>,
  },
  {
    path: '/portal/earnings',
    element: <AuthGuard allowedRoles={approvedFreelancerRoles}><EarningsPage /></AuthGuard>,
  },

  // Admin portal
  {
    path: '/admin',
    element: <AuthGuard allowedRoles={adminRoles}><AdminDashboard /></AuthGuard>,
  },
  {
    path: '/admin/applications',
    element: <AuthGuard allowedRoles={adminRoles}><ApplicationsList /></AuthGuard>,
  },
  {
    path: '/admin/applications/:id',
    element: <AuthGuard allowedRoles={adminRoles}><ApplicationDetail /></AuthGuard>,
  },

  // Phase 2 - Admin marketplace management
  {
    path: '/admin/opportunities',
    element: <AuthGuard allowedRoles={adminRoles}><AdminOpportunities /></AuthGuard>,
  },
  {
    path: '/admin/opportunities/new',
    element: <AuthGuard allowedRoles={adminRoles}><AdminNewOpportunity /></AuthGuard>,
  },
  {
    path: '/admin/opportunities/:id',
    element: <AuthGuard allowedRoles={adminRoles}><AdminOpportunityDetail /></AuthGuard>,
  },
  {
    path: '/admin/opportunity-applications',
    element: <AuthGuard allowedRoles={adminRoles}><AdminOpportunityApplications /></AuthGuard>,
  },
  {
    path: '/admin/invitations',
    element: <AuthGuard allowedRoles={adminRoles}><AdminInvitations /></AuthGuard>,
  },
  {
    path: '/admin/assignments',
    element: <AuthGuard allowedRoles={adminRoles}><AdminAssignments /></AuthGuard>,
  },
  {
    path: '/admin/assignments/:id',
    element: <AuthGuard allowedRoles={adminRoles}><AdminAssignmentDetail /></AuthGuard>,
  },

  // Phase 4 - Admin finance
  {
    path: '/admin/timesheets',
    element: <AuthGuard allowedRoles={adminRoles}><AdminTimesheets /></AuthGuard>,
  },
  {
    path: '/admin/timesheets/:id',
    element: <AuthGuard allowedRoles={adminRoles}><AdminTimesheetDetail /></AuthGuard>,
  },
  {
    path: '/admin/invoices',
    element: <AuthGuard allowedRoles={adminRoles}><AdminInvoices /></AuthGuard>,
  },
  {
    path: '/admin/invoices/:id',
    element: <AuthGuard allowedRoles={adminRoles}><AdminInvoiceDetail /></AuthGuard>,
  },
  {
    path: '/admin/payments',
    element: <AuthGuard allowedRoles={adminRoles}><AdminPayments /></AuthGuard>,
  },

  {
    path: '/admin/freelancers',
    element: <AuthGuard allowedRoles={adminRoles}><AdminFreelancers /></AuthGuard>,
  },
  {
    path: '/admin/documents',
    element: <AuthGuard allowedRoles={adminRoles}><AdminDocuments /></AuthGuard>,
  },
  {
    path: '/admin/compliance',
    element: <AuthGuard allowedRoles={adminRoles}><AdminCompliance /></AuthGuard>,
  },
  {
    path: '/admin/audit-log',
    element: <AuthGuard allowedRoles={adminRoles}><AdminAuditLog /></AuthGuard>,
  },
  {
    path: '/admin/settings',
    element: <AuthGuard allowedRoles={adminRoles}><AdminSettings /></AuthGuard>,
  },

  // 404
  { path: '*', element: <NotFound /> },
];

export default routes;