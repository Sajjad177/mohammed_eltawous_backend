import { Router } from 'express';

import workshopRoutes from '../../entities/workshop/workshop.routes.js';
import authRoutes from '../../entities/auth/auth.routes.js';
import subscriptionRoutes from '../../entities/subscription/subscription.routes.js';
import mailSendRoutes from '../../entities/mailSend/mailSend.router.js';

const router = Router();

const moduleRouter = [
  {
    path: '/auth',
    router: authRoutes
  },
  {
    path: '/workshop',
    router: workshopRoutes
  },
  {
    path: '/subscription',
    router: subscriptionRoutes
  },
  {
    path: '/send-mail',
    router: mailSendRoutes
  }
];

moduleRouter.forEach((route) => {
  router.use(route.path, route.router);
});

export default router;
