import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

// Public pages
import Home from './pages/Home';
import Tracking from './pages/Tracking';
import Points from './pages/Points';
import Login from './pages/Login';
import OAuth2Callback from './pages/OAuth2Callback';
import InfoPage from './pages/InfoPage';
import NotFound from './pages/NotFound';

// Client pages
import ClientDashboard from './pages/ClientDashboard';
import ClientShipments from './pages/ClientShipments';
import ShipmentDetails from './pages/ShipmentDetails';
import CreateShipment from './pages/CreateShipment';
import ClientClaims from './pages/ClientClaims';
import ClientProfile from './pages/ClientProfile';
import ShipmentRedirect from './pages/ShipmentRedirect';
import StripeSuccess from './pages/StripeSuccess';

// Courier pages
import CourierDashboard from './pages/CourierDashboard';
import CourierTaskDetails from './pages/CourierTaskDetails';
import CourierTasks from './pages/CourierTasks';
import CourierProfile from './pages/CourierProfile';

// Point pages
import PointAccept from './pages/PointAccept';
import PointDashboard from './pages/PointDashboard';
import PointPaymentVerification from './pages/PointPaymentVerification';
import PointRelease from './pages/PointRelease';
import PointShipments from './pages/PointShipments';
import PointWalkIn from './pages/PointWalkIn';
import PointProfile from './pages/PointProfile';

// Admin pages
import AdminDemoLab from './pages/AdminDemoLab';
import AdminDashboard from './pages/AdminDashboard';
import AdminHandoverLab from './pages/AdminHandoverLab';
import AdminUsers from './pages/AdminUsers';
import AdminLockerLab from './pages/AdminLockerLab';
import AdminPoints from './pages/AdminPoints';
import AdminShipments from './pages/AdminShipments';
import AdminPayments from './pages/AdminPayments';
import AdminClaims from './pages/AdminClaims';
import AdminReports from './pages/AdminReports';
import AdminTransitLab from './pages/AdminTransitLab';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/tracking',
    Component: Tracking,
  },
  {
    path: '/points',
    Component: Points,
  },
  {
    path: '/info/:slug',
    Component: InfoPage,
  },
  {
    path: '/oauth2-callback',
    Component: OAuth2Callback,
  },
  {
    Component: () => <PublicOnlyRoute />,
    children: [
      {
        path: '/login',
        Component: Login,
      },
    ],
  },
  {
    Component: () => <ProtectedRoute allowedRoles={['client']} />,
    children: [
      {
        path: '/client',
        Component: ClientDashboard,
      },
      {
        path: '/client/shipments',
        Component: ClientShipments,
      },
      {
        path: '/client/shipments/create',
        Component: CreateShipment,
      },
      {
        path: '/client/shipments/:id/redirect',
        Component: ShipmentRedirect,
      },
      {
        path: '/client/shipments/:paymentId/stripe-success',
        Component: StripeSuccess,
      },
      {
        path: '/client/shipments/:id',
        Component: ShipmentDetails,
      },
      {
        path: '/client/claims',
        Component: ClientClaims,
      },
      {
        path: '/client/profile',
        Component: ClientProfile,
      },
    ],
  },
  {
    Component: () => <ProtectedRoute allowedRoles={['courier']} />,
    children: [
      {
        path: '/courier',
        Component: CourierDashboard,
      },
      {
        path: '/courier/tasks',
        Component: CourierTasks,
      },
      {
        path: '/courier/tasks/:id',
        Component: CourierTaskDetails,
      },
      {
        path: '/courier/profile',
        Component: CourierProfile,
      },
    ],
  },
  {
    Component: () => <ProtectedRoute allowedRoles={['point']} />,
    children: [
      {
        path: '/point',
        Component: PointDashboard,
      },
      {
        path: '/point/shipments',
        Component: PointShipments,
      },
      {
        path: '/point/accept',
        Component: PointAccept,
      },
      {
        path: '/point/release',
        Component: PointRelease,
      },
      {
        path: '/point/payment-verification',
        Component: PointPaymentVerification,
      },
      {
        path: '/point/walk-in',
        Component: PointWalkIn,
      },
      {
        path: '/point/profile',
        Component: PointProfile,
      },
    ],
  },
  {
    Component: () => <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        Component: AdminDashboard,
      },
      {
        path: '/admin/demo-lab',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN', 'DISPATCHER']} children={<AdminDemoLab />} />,
      },
      {
        path: '/admin/demo/locker',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN', 'DISPATCHER']} children={<AdminLockerLab />} />,
      },
      {
        path: '/admin/demo/transit',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN', 'DISPATCHER']} children={<AdminTransitLab />} />,
      },
      {
        path: '/admin/demo/handover',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN', 'DISPATCHER']} children={<AdminHandoverLab />} />,
      },
      {
        path: '/admin/users',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN']} children={<AdminUsers />} />,
      },
      {
        path: '/admin/points',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN']} children={<AdminPoints />} />,
      },
      {
        path: '/admin/shipments',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN', 'DISPATCHER']} children={<AdminShipments />} />,
      },
      {
        path: '/admin/payments',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN']} children={<AdminPayments />} />,
      },
      {
        path: '/admin/claims',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN']} children={<AdminClaims />} />,
      },
      {
        path: '/admin/reports',
        Component: () => <ProtectedRoute allowedRoles={['admin']} allowedAdminScopes={['ADMIN']} children={<AdminReports />} />,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
