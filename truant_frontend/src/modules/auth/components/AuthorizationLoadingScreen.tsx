import Box from "@mui/material/Box";

const AuthorizationLoadingScreen = () => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "grid",
      placeItems: "center",
      backdropFilter: "blur(2px)",
    }}
  >
    <Box
      component="img"
      src="/images/truant-mark.png"
      alt="Loading"
      sx={{
        inlineSize: 80,
        blockSize: "auto",
        backfaceVisibility: "hidden",
        animation: "logoLoad 1.4s ease-in-out infinite",

        "@keyframes logoLoad": {
          "0%, 100%": {
            transform: "perspective(500px) rotateY(-30deg) scale(0.96)",
            opacity: 0.7,
          },
          "50%": {
            transform: "perspective(500px) rotateY(30deg) scale(1.03)",
            opacity: 1,
          },
        },

        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    />
  </Box>
);

export default AuthorizationLoadingScreen;
