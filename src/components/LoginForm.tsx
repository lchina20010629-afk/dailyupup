"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

export function LoginForm() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const password = new FormData(event.currentTarget).get("password");
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (response.ok) window.location.assign("/today");
      }}
    >
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <TextField name="password" label="密码" type="password" autoComplete="current-password" size="small" />
        <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
          进入
        </Button>
      </Stack>
    </form>
  );
}
