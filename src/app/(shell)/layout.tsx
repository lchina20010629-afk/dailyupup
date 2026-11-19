import { InstallHint } from "@/components/InstallHint";
import { TabBar } from "@/components/TabBar";
import { ThemeMenu } from "@/components/ThemeMenu";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <TabBar />
          <ThemeMenu />
        </div>
      </div>
      <InstallHint />
      <main className="shell">{children}</main>
    </>
  );
}
