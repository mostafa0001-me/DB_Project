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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/nominations" component={NominationsPage} />
      <ProtectedRoute path="/add-nomination" component={AddNominationPage} />
      <ProtectedRoute path="/top-movies" component={TopMoviesPage} />
      <ProtectedRoute path="/staff-oscars" component={StaffOscarsPage} />
      <ProtectedRoute path="/birth-countries" component={BirthCountriesPage} />
      <ProtectedRoute path="/staff-by-country" component={StaffByCountryPage} />
      <ProtectedRoute path="/dream-team" component={DreamTeamPage} />
      <ProtectedRoute path="/production-companies" component={ProductionCompaniesPage} />
      <ProtectedRoute path="/non-english-movies" component={NonEnglishMoviesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default App;
