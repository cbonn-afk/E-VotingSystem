// Type Imports
import type { ChildrenType } from "@core/types";

// Component Imports
import Providers from "@components/Providers";
import ScrollToTop from "@core/components/scroll-to-top";
import AppReactToastify from "@/libs/styles/AppReactToastify";

// MUI Imports
import Button from "@mui/material/Button";
import AuthGuard from "@/modules/auth/components/AuthGuard";
import RoutePermissionGuard from "@/modules/auth/components/RoutePermissionGuard";

const Layout = async (props: ChildrenType) => {
  const { children } = props;

  // Vars
  const direction = "ltr";

  return (
    <Providers direction={direction}>
      <AuthGuard>
        <RoutePermissionGuard>
          <div className="flex flex-col flex-auto" data-skin="default">
            {children}
          </div>
        </RoutePermissionGuard>
        <ScrollToTop className="mui-fixed">
          <Button
            variant="contained"
            className="is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center"
          >
            <i className="bx-up-arrow-alt" />
          </Button>
        </ScrollToTop>
        <AppReactToastify
          direction={direction}
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
        />
      </AuthGuard>
    </Providers>
  );
};

export default Layout;
