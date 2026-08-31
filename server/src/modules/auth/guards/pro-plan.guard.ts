import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Guard that checks if the authenticated user has a Pro or higher plan.
 * Use on any route that requires a paid subscription.
 *
 * NOTE: Pro plan gating is temporarily disabled — all users have full access.
 * Re-enable by uncommenting the plan check below.
 *
 * Usage: @UseGuards(JwtAuthGuard, ProPlanGuard)
 */
@Injectable()
export class ProPlanGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // ── PRO PLAN CHECK TEMPORARILY DISABLED ───────────────────────────────
    // All features are unlocked for everyone during development/testing.
    // To re-enable, uncomment the block below:
    //
    // const request = context.switchToHttp().getRequest();
    // const user = request.user;
    // const allowedPlans: Plan[] = [Plan.PRO, Plan.AGENCY, Plan.ENTERPRISE];
    // if (!allowedPlans.includes(user?.plan)) {
    //   throw new ForbiddenException(
    //     'This feature requires a Pro plan. Upgrade at linkport.io/upgrade',
    //   );
    // }
    // ──────────────────────────────────────────────────────────────────────

    return true; // Allow everyone
  }
}
