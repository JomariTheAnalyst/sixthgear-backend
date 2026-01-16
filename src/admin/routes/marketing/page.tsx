import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import {
  Container,
  Heading,
  Button,
  Text,
  Badge,
  Tabs,
  Input,
  Label,
  Select,
  Textarea,
} from "@medusajs/ui";
import { useEffect, useState } from "react";

type MarketingItem = {
  id: string;
  type: "strip" | "banner" | "popup";
  status: "draft" | "published";
  title: string | null;
  message: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  background_color: string | null;
  text_color: string | null;
  enabled: boolean;
  priority: number;
  placement: string | null;
  pages: string[];
  device: string;
  delay_ms: number | null;
  frequency: string | null;
  created_at: string;
};

const emptyItem: Partial<MarketingItem> = {
  type: "strip",
  status: "draft",
  title: "",
  message: "",
  cta_text: "",
  cta_url: "",
  background_color: "#F16D34",
  text_color: "#FFFFFF",
  enabled: true,
  priority: 0,
  pages: ["/"],
  device: "all",
  placement: "",
  delay_ms: 2000,
  frequency: "once_session",
};

const MarketingPage = () => {
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("strip");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MarketingItem> | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/marketing", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.marketing_items || []);
      }
    } catch (error) {
      console.error("Failed to fetch marketing items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) => item.type === activeTab);

  const handleCreate = () => {
    setEditingItem({
      ...emptyItem,
      type: activeTab as "strip" | "banner" | "popup",
    });
    setShowForm(true);
  };

  const handleEdit = (item: MarketingItem) => {
    setEditingItem({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);

    try {
      const isNew = !editingItem.id;
      const url = isNew
        ? "/admin/marketing"
        : `/admin/marketing/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...editingItem,
        pages:
          typeof editingItem.pages === "string"
            ? (editingItem.pages as string)
                .split(",")
                .map((p: string) => p.trim())
            : editingItem.pages,
        priority: Number(editingItem.priority) || 0,
        delay_ms: Number(editingItem.delay_ms) || 2000,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        fetchItems();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save"}`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: MarketingItem) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await fetch(`/admin/marketing/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchItems();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/admin/marketing/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchItems();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const generatePreview = async (item: MarketingItem) => {
    try {
      const response = await fetch(
        `/admin/marketing/${item.id}/preview-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ redirect_path: "/" }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        window.open(data.preview_url, "_blank");
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  };

  const updateField = (
    field: string,
    value: string | number | boolean | string[]
  ) => {
    setEditingItem((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Marketing</Heading>
          <Text className="text-ui-fg-subtle">
            Manage announcement strips, banners, and popups
          </Text>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          Create{" "}
          {activeTab === "strip"
            ? "Strip"
            : activeTab === "banner"
            ? "Banner"
            : "Popup"}
        </Button>
      </div>

      {showForm && editingItem && (
        <div className="fixed inset-0 bg-ui-bg-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-ui-bg-base rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevation-modal">
            <div className="px-6 py-4 border-b border-ui-border-base">
              <Heading level="h2">
                {editingItem.id ? "Edit" : "Create"} {editingItem.type}
              </Heading>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editingItem.type}
                    onValueChange={(v) => updateField("type", v)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="strip">
                        Announcement Strip
                      </Select.Item>
                      <Select.Item value="banner">Banner</Select.Item>
                      <Select.Item value="popup">Popup</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(v) => updateField("status", v)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="published">Published</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Optional title"
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={editingItem.message || ""}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Main message text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Text</Label>
                  <Input
                    value={editingItem.cta_text || ""}
                    onChange={(e) => updateField("cta_text", e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label>CTA URL</Label>
                  <Input
                    value={editingItem.cta_url || ""}
                    onChange={(e) => updateField("cta_url", e.target.value)}
                    placeholder="/shop"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={editingItem.background_color || "#F16D34"}
                    onChange={(e) =>
                      updateField("background_color", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={editingItem.text_color || "#FFFFFF"}
                    onChange={(e) => updateField("text_color", e.target.value)}
                  />
                </div>
              </div>

              {editingItem.type === "banner" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Desktop Image URL</Label>
                      <Input
                        value={editingItem.image_desktop_url || ""}
                        onChange={(e) =>
                          updateField("image_desktop_url", e.target.value)
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Mobile Image URL</Label>
                      <Input
                        value={editingItem.image_mobile_url || ""}
                        onChange={(e) =>
                          updateField("image_mobile_url", e.target.value)
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Placement</Label>
                    <Select
                      value={editingItem.placement || ""}
                      onValueChange={(v) => updateField("placement", v)}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Select placement" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="home_hero_below">
                          Home - Below Hero
                        </Select.Item>
                        <Select.Item value="home_mid">
                          Home - Middle
                        </Select.Item>
                        <Select.Item value="shop_top">Shop - Top</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </>
              )}

              {editingItem.type === "popup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Delay (ms)</Label>
                    <Input
                      type="number"
                      value={editingItem.delay_ms || 2000}
                      onChange={(e) =>
                        updateField("delay_ms", parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={editingItem.frequency || "once_session"}
                      onValueChange={(v) => updateField("frequency", v)}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="once_session">
                          Once per session
                        </Select.Item>
                        <Select.Item value="once_day">Once per day</Select.Item>
                        <Select.Item value="always">Always</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={editingItem.priority || 0}
                    onChange={(e) =>
                      updateField("priority", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Device</Label>
                  <Select
                    value={editingItem.device || "all"}
                    onValueChange={(v) => updateField("device", v)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="all">All Devices</Select.Item>
                      <Select.Item value="desktop">Desktop Only</Select.Item>
                      <Select.Item value="mobile">Mobile Only</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Pages (comma-separated)</Label>
                <Input
                  value={
                    Array.isArray(editingItem.pages)
                      ? editingItem.pages.join(", ")
                      : editingItem.pages || "/"
                  }
                  onChange={(e) => updateField("pages", e.target.value)}
                  placeholder="/, /shop, /products/*"
                />
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  Use * for all pages
                </Text>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-ui-border-base">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        <Tabs defaultValue="strip" onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="strip">
              Strips ({items.filter((i) => i.type === "strip").length})
            </Tabs.Trigger>
            <Tabs.Trigger value="banner">
              Banners ({items.filter((i) => i.type === "banner").length})
            </Tabs.Trigger>
            <Tabs.Trigger value="popup">
              Popups ({items.filter((i) => i.type === "popup").length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value={activeTab} className="mt-4">
            {loading ? (
              <Text className="text-ui-fg-subtle">Loading...</Text>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-ui-bg-subtle rounded-lg">
                <Text className="text-ui-fg-subtle">No {activeTab}s found</Text>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={handleCreate}
                >
                  Create your first {activeTab}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-base"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text weight="plus" className="truncate">
                            {item.title ||
                              item.message?.substring(0, 50) ||
                              "Untitled"}
                          </Text>
                          <Badge
                            color={
                              item.status === "published" ? "green" : "orange"
                            }
                            size="small"
                          >
                            {item.status}
                          </Badge>
                          {!item.enabled && (
                            <Badge color="grey" size="small">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        {item.message && (
                          <Text
                            size="small"
                            className="text-ui-fg-subtle truncate"
                          >
                            {item.message}
                          </Text>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => generatePreview(item)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => toggleStatus(item)}
                        >
                          {item.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => deleteItem(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Marketing",
  icon: ChatBubbleLeftRight,
});

export default MarketingPage;
