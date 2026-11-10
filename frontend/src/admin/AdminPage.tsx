import { useState } from "react";
import { Chip } from "../components";
import pages from "../pages/Pages.module.css";
import styles from "./Admin.module.css";
import { GradingLog } from "./GradingLog";
import { UsersPanel } from "./UsersPanel";

type Tab = "log" | "users";

/** Admin panel part 1 (FR-18): grading log, users, and progress reset. */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>("log");
  return (
    <div className={pages.page}>
      <h1 className={pages.title}>Admin</h1>
      <div className={styles.tabs}>
        <Chip selected={tab === "log"} onToggle={() => setTab("log")}>
          Grading log
        </Chip>
        <Chip selected={tab === "users"} onToggle={() => setTab("users")}>
          Users
        </Chip>
      </div>
      {tab === "log" ? <GradingLog /> : <UsersPanel />}
    </div>
  );
}
