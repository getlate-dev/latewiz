"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Clock, Users, ListOrdered } from "lucide-react";
import { RecentPosts } from "./recent-posts";
import { AccountsPanel } from "./accounts-panel";
import { QueuePanel } from "./queue-panel";

interface ContentTabsProps {
  posts: any[];
  accounts: any[];
  slots: string[];
  postsLoading: boolean;
  accountsLoading: boolean;
}

type TabValue = "posts" | "accounts" | "queue";

interface TabButtonProps {
  value: TabValue;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ value, isActive, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${
        isActive
          ? "bg-background text-foreground shadow border border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function ContentTabs({
  posts,
  accounts,
  slots,
  postsLoading,
  accountsLoading,
}: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("posts");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full pt-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Tabs */}
        <div className="md:col-span-3">
          <div className="flex flex-col gap-2">
            <TabButton
              value="posts"
              isActive={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              icon={<Clock className="h-4 w-4" />}
              label="Recent Posts"
            />
            <TabButton
              value="accounts"
              isActive={activeTab === "accounts"}
              onClick={() => setActiveTab("accounts")}
              icon={<Users className="h-4 w-4" />}
              label="Accounts"
            />
            <TabButton
              value="queue"
              isActive={activeTab === "queue"}
              onClick={() => setActiveTab("queue")}
              icon={<ListOrdered className="h-4 w-4" />}
              label="Queue"
            />
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden md:block md:col-span-0 relative">
          <div className="absolute inset-0 border-l border-border/50" />
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-8 md:pl-6">
          <TabsContent value="posts" className="mt-0 data-[state=inactive]:hidden">
            <RecentPosts posts={posts} isLoading={postsLoading} />
          </TabsContent>
          <TabsContent value="accounts" className="mt-0 data-[state=inactive]:hidden">
            <AccountsPanel accounts={accounts} isLoading={accountsLoading} />
          </TabsContent>
          <TabsContent value="queue" className="mt-0 data-[state=inactive]:hidden">
            <QueuePanel slots={slots} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
