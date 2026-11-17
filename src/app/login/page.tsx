import { LoginForm } from "@/components/LoginForm";
import { missingEnv } from "@/lib/env";

export default function LoginPage() {
  const missing = missingEnv(process.env);
  return (
    <main className="login">
      <h1>日常记录</h1>
      {missing.length > 0 ? <p>还缺这些配置：{missing.join("、")}</p> : null}
      <LoginForm />
    </main>
  );
}
