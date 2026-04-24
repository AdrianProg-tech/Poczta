import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

// Public pages
import Home from './pages/Home';
import Tracking from './pages/Tracking';
import Points from './pages/Points';
import Login from './pages/Login';
import InfoPage from './pages/InfoPage';
import NotFound from './pages/NotFound';

// Client pages
import ClientDashboard from './pages/ClientDashboard';
import ClientShipments from './pages/ClientShipments';
import ShipmentDetails from './pages/ShipmentDetails';
import CreateShipment from './pages/CreateShipment';
import ClientClaims from './pages/ClientClaims';
import ShipmentRedirect from './pages/ShipmentRedirect';

// Courier pages
import CourierDashboard from './pages/CourierDashboard';
import CourierTasks from './pages/CourierTasks';

// Point pages
import PointDashboard from './pages/PointDashboard';
import PointShipments from './pages/PointShipments';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPoints from './pages/AdminPoints';
import AdminShipments from './pages/AdminShipments';
import AdminPayments from './pages/AdminPayments';
import AdminClaims from './pages/AdminClaims';
import AdminReports from './pages/AdminReports';

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
        path: '/client/shipments/:id',
        Component: ShipmentDetails,
      },
      {
        path: '/client/claims',
        Component: ClientClaims,
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
        path: '/admin/users',
        Component: AdminUsers,
      },
      {
        path: '/admin/points',
        Component: AdminPoints,
      },
      {
        path: '/admin/shipments',
        Component: AdminShipments,
      },
      {
        path: '/admin/payments',
        Component: AdminPayments,
      },
      {
        path: '/admin/claims',
        Component: AdminClaims,
      },
      {
        path: '/admin/reports',
        Component: AdminReports,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
