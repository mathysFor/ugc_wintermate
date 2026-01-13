import { BrowserRouter, useRoutes } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/query-config";

import { useAppRoutes } from "@/navigation/use-app-routes";
import { AuthLayout } from "@/layouts/auth-layout";

const Routes = () => {
  const { config } = useAppRoutes();
  const route = useRoutes(config);

  return (
    <MainLayout>
      {route}
    </MainLayout>
  );
};

export const Router = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthLayout>
        <Routes />
      </AuthLayout>
    </QueryClientProvider>
  </BrowserRouter>
);
