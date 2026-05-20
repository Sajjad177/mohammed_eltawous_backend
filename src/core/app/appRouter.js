import { Router } from 'express';

import workshopRoutes from '../../entities/workshop/workshop.routes.js';
import authRoutes from '../../entities/auth/auth.routes.js';

const router = Router();

const moduleRouter = [
  {
    path: '/auth',
    router: authRoutes
  },
  {
    path: '/workshop',
    router: workshopRoutes
  }
];

moduleRouter.forEach((route) => {
  router.use(route.path, route.router);
});

export default router;
