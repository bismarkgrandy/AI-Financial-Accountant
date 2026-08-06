import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';
import { requireRole } from '@/middleware/roles';

const router = Router();

// Public — the invitee has no account yet
router.post('/accept-invite', usersController.acceptInvite);

router.get('/', authenticate, requireVerified, requireRole('owner'), usersController.listUsers);
router.get('/invites', authenticate, requireVerified, requireRole('owner'), usersController.listPendingInvites);
router.post('/invite', authenticate, requireVerified, requireRole('owner'), usersController.inviteStaff);
router.patch('/:id/role', authenticate, requireVerified, requireRole('owner'), usersController.updateUserRole);
router.patch('/:id/deactivate', authenticate, requireVerified, requireRole('owner'), usersController.deactivateUser);
router.patch('/:id/activate', authenticate, requireVerified, requireRole('owner'), usersController.activateUser);

export default router;