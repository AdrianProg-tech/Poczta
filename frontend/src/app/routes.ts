import { createBrowserRouter } from 'react-router';

// Public pages
import Home from './pages/Home';
import Tracking from './pages/Tracking';
import Points from './pages/Points';
import Login from './pages/Login';

// Client pages
import ClientDashboard from './pages/ClientDashboard';
import ShipmentDetails from './pages/ShipmentDetails';
import CreateShipment from './pages/CreateShipment';

// Courier pages
import CourierDashboard from './pages/CourierDashboard';

// Point pages
import PointDashboard from './pages/PointDashboard';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';

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
    path: '/login',
    Component: Login,
  },
  // Client routes
  {
    path: '/client',
    Component: ClientDashboard,
  },
  {
    path: '/client/shipments',
    Component: ClientDashboard,
  },
  {
    path: '/client/shipments/:id',
    Component: ShipmentDetails,
  },
  {
    path: '/client/shipments/create',
    Component: CreateShipment,
  },
  {
    path: '/client/claims',
    Component: ClientDashboard,
  },
  // Courier routes
  {
    path: '/courier',
    Component: CourierDashboard,
  },
  {
    path: '/courier/tasks',
    Component: CourierDashboard,
  },
  // Point routes
  {
    path: '/point',
    Component: PointDashboard,
  },
  {
    path: '/point/shipments',
    Component: PointDashboard,
  },
  // Admin routes
  {
    path: '/admin',
    Component: AdminDashboard,
  },
  {
    path: '/admin/users',
    Component: AdminDashboard,
  },
  {
    path: '/admin/points',
    Component: AdminDashboard,
  },
  {
    path: '/admin/shipments',
    Component: AdminDashboard,
  },
  {
    path: '/admin/payments',
    Component: AdminDashboard,
  },
  {
    path: '/admin/claims',
    Component: AdminDashboard,
  },
  {
    path: '/admin/reports',
    Component: AdminDashboard,
  },
]);
