"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import { useRouter } from "next/navigation";

// MUI Imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
// import Checkbox from "@mui/material/Checkbox";
// import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

// Component Imports
import CustomTextField from "@core/components/mui/TextField";
import { useForm } from "react-hook-form";
import { LoginInput, loginSchema } from "@/modules/auth/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthorizationLoadingScreen from "@/modules/auth/components/AuthorizationLoadingScreen";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { useLogin } from "@/modules/auth/hooks/useLogin";
import { ApiError } from "@/libs/api/apiError";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { AlertTitle } from "@mui/material";
import { getAuthenticatedDestination } from "@/modules/auth/passwordChange";

const LoginV2 = () => {
  //   API
  const currentUser = useCurrentUser();
  const login = useLogin();
  const theme = useTheme();

  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false);

  // Hooks
  const router = useRouter();

  // Errors & Success
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const logoSource =
    theme.palette.mode === "dark"
      ? "/images/truant-mark.png"
      : "/images/truant-mark-dark.png";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Checks if user is already logged in
  useEffect(() => {
    if (currentUser.data) {
      router.replace(
        getAuthenticatedDestination(currentUser.data, window.location.search),
      );
    }
  }, [currentUser.data, router]);

  //  Submit handler
  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const user = await login.mutateAsync(values);

      setSuccessMessage("Login successful");

      router.replace(getAuthenticatedDestination(user, window.location.search));
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const emailError = error.errors.email?.[0];
        const passwordError = error.errors.password?.[0];

        if (emailError) {
          setError("email", {
            message: emailError,
          });
        }

        if (passwordError) {
          setError("password", {
            message: passwordError,
          });
        }

        if (emailError || passwordError) {
          return;
        }
      }
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  });

  const handleClickShowPassword = () => setIsPasswordShown((show) => !show);

  // Same loading gate AuthGuard uses — avoids flashing the real form while
  // the "already logged in?" check is still in flight (e.g. it's about to
  // fail with a 500/503 and bounce to the maintenance page).
  // if (currentUser.isPending) {
  //   return <AuthorizationLoadingScreen />;
  // }

  return (
    <Box className="flex min-bs-[100dvh] items-center justify-center bg-backgroundDefault p-6">
      <Paper className="is-full max-is-[420px] p-6 sm:p-8" elevation={3}>
        <Stack spacing={6}>
          <Stack spacing={1} className="items-center text-center">
            <Box
              component="img"
              src={logoSource}
              alt="Truant Enterprises logo"
              sx={{
                inlineSize: { xs: 68, sm: 76 },
                maxInlineSize: "100%",
                blockSize: "auto",
                objectFit: "contain",
              }}
            />
            <Typography fontWeight={"bold"} variant="h5" color="text.secondary">
              Login to continue
            </Typography>
          </Stack>

          {serverError && <Alert severity="error">{serverError}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <form
            noValidate
            autoComplete="off"
            onSubmit={onSubmit}
            className="flex flex-col gap-5"
          >
            <CustomTextField
              autoFocus
              fullWidth
              label="Email"
              placeholder="Enter your email"
              autoComplete={"email"}
              error={Boolean(errors.email?.message)}
              helperText={errors.email?.message}
              {...register("email")}
            />
            <CustomTextField
              fullWidth
              label="Password"
              error={Boolean(errors.password?.message)}
              helperText={errors.password?.message}
              {...register("password")}
              placeholder="············"
              type={isPasswordShown ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleClickShowPassword}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <i
                          className={isPasswordShown ? "bx-hide" : "bx-show"}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {/*Todo: Add Remember me capabilities*/}
            {/*<div className="flex justify-between items-center flex-wrap gap-x-3 gap-y-1">*/}
            {/*  <FormControlLabel control={<Checkbox />} label="Remember me" />*/}
            {/*  <Typography*/}
            {/*    className="text-end"*/}
            {/*    color="primary.main"*/}
            {/*    component={Link}*/}
            {/*  >*/}
            {/*    Forgot password?*/}
            {/*  </Typography>*/}
            {/*</div>*/}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Stack direction="row" alignItems="center">
                  <Typography variant="body1" color="info" fontWeight="bold">
                    Logging in...
                  </Typography>
                  <CircularProgress color={"info"} thickness={5} size={24} />
                </Stack>
              ) : (
                <Typography variant="body1" color="info" fontWeight="bold">
                  Login
                </Typography>
              )}
            </Button>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginV2;
