"use client";

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
      <label>
        密码
        <input name="password" type="password" autoComplete="current-password" />
      </label>
      <button type="submit">进入</button>
    </form>
  );
}
