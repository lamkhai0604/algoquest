import { useState } from "react";
import { BackButton, Chip } from "../components";
import pages from "../pages/Pages.module.css";
import styles from "./Admin.module.css";
import { AuditLogPanel } from "./AuditLogPanel";
import { GradingLog } from "./GradingLog";
import { RulesEditor } from "./RulesEditor";
import { UsersPanel } from "./UsersPanel";

type Tab = "log" | "users" | "rules" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "log", label: "Grading log" },
  { id: "users", label: "Users and roles" },
  { id: "rules", label: "Game rules" },
  { id: "audit", label: "Audit log" },
];

/** Admin panel (FR-17.6, FR-18): grading log, users and roles, rules, audit. */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>("log");
  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton to="/" label="Back to the Learning Path" />
        <h1 className={pages.title}>Admin</h1>
      </div>
      <div className={styles.tabs}>
        {TABS.map((item) => (
          <Chip
            key={item.id}
            selected={tab === item.id}
            onToggle={() => setTab(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
      {tab === "log" && <GradingLog />}
      {tab === "users" && <UsersPanel />}
      {tab === "rules" && <RulesEditor />}
      {tab === "audit" && <AuditLogPanel />}
    </div>
  );
}
