"use client";
import FileDiffView from "@ui/components/file-diff";
import "diff2html/bundles/css/diff2html.min.css";
import "highlight.js/styles/github.css";

const gitDiff = `--- a.tsx
+++ a.tsx
@@ -0,0 +1,18 @@
+import { ContentArea } from '@/components/ContentArea';
+import { Sidebar } from '@/components/Sidebar';
+import React from "react";
+
+interface DashboardLayoutProps {
+  children: React.ReactNode;
+}
+
+export default function DashboardLayout({ children }: DashboardLayoutProps) {
+  return (
+    <>
+      <Sidebar userName="John Smith" menuItems={[{label: 'Profile'}, {label: 'Settings'}]} />
+      <ContentArea title="Welcome" subtitle="to your private space on the web">
+        {children}
+      </ContentArea>
+    </>
+  );
+}
--- b.tsx
+++ b.tsx
@@ -0,0 +1,17 @@
+import { PageLink } from '@/components/PageLink';
+
+export default function DashboardPage() {
+  const pageLinks = [
+    { icon: '⚛️', color: 'text-blue-400', label: 'Physics' },
+    { icon: '🧪', color: 'text-green-400', label: 'Chemistry' },
+    { icon: '🧬', color: 'text-red-400', label: 'Biology' }
+  ];
+
+  return (
+    <>
+      {pageLinks.map((link, index) => (
+        <PageLink key={index} {...link} />
+      ))}
+    </>
+  );
+}`;

export default function DebugPage() {
  return (
    <main>
      <FileDiffView diff={gitDiff} />
    </main>
  );
}
