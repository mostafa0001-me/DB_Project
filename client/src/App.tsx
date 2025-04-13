import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "./pages/auth-page";
import Layout from "./components/Layout";
import DashboardPage from "./pages/dashboard-page";
import NominationsPage from "./pages/nominations-page";
import AddNominationPage from "./pages/add-nomination-page";
import TopMoviesPage from "./pages/top-movies-page";
import StaffOscarsPage from "./pages/staff-oscars-page";
import BirthCountriesPage from "./pages/birth-countries-page";
import StaffByCountryPage from "./pages/staff-by-country-page";
import DreamTeamPage from "./pages/dream-team-page";
import ProductionCompaniesPage from "./pages/production-companies-page";
import NonEnglishMoviesPage from "./pages/non-english-movies-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useAuth } from "./hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// This helper component applies the Layout for protected routes
function ProtectedLayout({ title, children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <Layout title={title}>
      {children}
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        <ProtectedLayout title="Dashboard">
          <DashboardPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/nominations">
        <ProtectedLayout title="My Nominations">
          <NominationsPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/add-nomination">
        <ProtectedLayout title="Add Nomination">
          <AddNominationPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/top-movies">
        <ProtectedLayout title="Top Nominated Movies">
          <TopMoviesPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/staff-oscars">
        <ProtectedLayout title="Staff Oscar Stats">
          <StaffOscarsPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/birth-countries">
        <ProtectedLayout title="Birth Countries">
          <BirthCountriesPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/staff-by-country">
        <ProtectedLayout title="Staff by Country">
          <StaffByCountryPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/dream-team">
        <ProtectedLayout title="Dream Team">
          <DreamTeamPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/production-companies">
        <ProtectedLayout title="Top Production Companies">
          <ProductionCompaniesPage />
        </ProtectedLayout>
      </Route>
      
      <Route path="/non-english-movies">
        <ProtectedLayout title="Non-English Winners">
          <NonEnglishMoviesPage />
        </ProtectedLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;