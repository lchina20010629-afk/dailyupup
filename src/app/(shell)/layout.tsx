import { TabBar } from "@/components/TabBar";
import { InstallHint } from "@/components/InstallHint";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstallHint />
      <main className="shell">{children}</main>
      <TabBar />
    </>
  );
}
