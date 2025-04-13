import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import Layout from "@/components/Layout";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  console.log(`Protected Route for path ${path}:`, { 
    isLoading, 
    username: user?.username || 'undefined', 
    userKeys: user ? Object.keys(user) : [] 
  });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Check if there's a user object at all and that it has the required properties
  // First check for lowercase username property (from our schema)
  // Then fallback to checking for Username property (from database)
  const hasValidUser = user && (user.username || (user as any).Username);
  
  if (!hasValidUser) {
    console.log(`No valid user found, redirecting to /auth from ${path}`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log(`User authenticated, rendering component for ${path}`);
  return (
    <Route path={path}>
      <Layout title={path === "/" ? "Dashboard" : path.substring(1).split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}>
        <Component />
      </Layout>
    </Route>
  );
}
