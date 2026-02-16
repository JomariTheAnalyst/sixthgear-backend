import { Container, Heading, Button, toast } from "@medusajs/ui";
import { useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";

const MeilisearchPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/admin/meilisearch/sync", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Successfully triggered data sync to Meilisearch");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Failed to sync data to Meilisearch");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Meilisearch Sync</Heading>
      </div>
      <div className="px-6 py-8">
        <p className="text-sm text-gray-600 mb-4">
          Click the button below to manually sync all products to Meilisearch.
          Products are also automatically synced when created, updated, or
          deleted.
        </p>
        <Button variant="primary" onClick={handleSync} isLoading={isLoading}>
          Sync Data to Meilisearch
        </Button>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Meilisearch",
});

export default MeilisearchPage;
