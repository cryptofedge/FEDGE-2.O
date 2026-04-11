import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Routes accessible by unauthenticated users
  publicRoutes: ['/', '/api/webhooks(.*)'],
  
  // Custom logic to intercept restricted routes based on Database Role could be added here
  // For MVP, we pass authentication to the pages themselves.
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
