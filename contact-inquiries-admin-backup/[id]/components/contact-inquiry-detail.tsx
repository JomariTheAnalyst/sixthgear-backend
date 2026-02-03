import { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Text,
  Label,
  Select,
  Textarea,
  Button,
  Badge,
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";

type ContactInquiry = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
  internal_notes: string | null;
  subscribed_to_newsletter: boolean;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const statusColors = {
  new: "blue",
  in_progress: "orange",
  resolved: "green",
  closed: "grey",
} as const;

export const ContactInquiryDetail = ({ inquiryId }: { inquiryId: string }) => {
  const [inquiry, setInquiry] = useState<ContactInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchInquiry();
  }, [inquiryId]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/admin/contact-inquiries/${inquiryId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inquiry");
      }

      const data = await response.json();
      setInquiry(data.inquiry);
      setStatus(data.inquiry.status);
      setInternalNotes(data.inquiry.internal_notes || "");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load inquiry");
      navigate("/contact-inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/admin/contact-inquiries/${inquiryId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status,
          internal_notes: internalNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update inquiry");
      }

      const data = await response.json();
      setInquiry(data.inquiry);
      alert("Inquiry updated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update inquiry");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!inquiry) {
    return <Text>Inquiry not found</Text>;
  }

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Container>
        <Heading level="h2" className="mb-4">
          Customer Information
        </Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Text>
              {inquiry.first_name} {inquiry.last_name}
            </Text>
          </div>
          <div>
            <Label>Email</Label>
            <Text>{inquiry.email}</Text>
          </div>
          <div>
            <Label>Phone</Label>
            <Text>{inquiry.phone || "—"}</Text>
          </div>
          <div>
            <Label>Newsletter</Label>
            <Text>{inquiry.subscribed_to_newsletter ? "Yes" : "No"}</Text>
          </div>
        </div>
      </Container>

      {/* Inquiry Details */}
      <Container>
        <Heading level="h2" className="mb-4">
          Inquiry Details
        </Heading>
        <div className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Text>{inquiry.subject || "—"}</Text>
          </div>
          <div>
            <Label>Message</Label>
            <div className="bg-ui-bg-subtle p-4 rounded-md">
              <Text className="whitespace-pre-wrap">{inquiry.message}</Text>
            </div>
          </div>
          <div>
            <Label>Submitted</Label>
            <Text>{new Date(inquiry.created_at).toLocaleString()}</Text>
          </div>
        </div>
      </Container>

      {/* Status Management */}
      <Container>
        <Heading level="h2" className="mb-4">
          Status Management
        </Heading>
        <div className="space-y-4">
          <div>
            <Label>Current Status</Label>
            <div className="mt-2">
              <Badge color={statusColors[inquiry.status]}>
                {inquiry.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div>
            <Label htmlFor="status">Update Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="new">New</Select.Item>
                <Select.Item value="in_progress">In Progress</Select.Item>
                <Select.Item value="resolved">Resolved</Select.Item>
                <Select.Item value="closed">Closed</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this inquiry..."
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Container>

      {/* Metadata */}
      <Container>
        <Heading level="h2" className="mb-4">
          Metadata
        </Heading>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>IP Address</Label>
            <Text className="text-ui-fg-subtle">
              {inquiry.ip_address || "—"}
            </Text>
          </div>
          <div>
            <Label>Last Updated</Label>
            <Text className="text-ui-fg-subtle">
              {new Date(inquiry.updated_at).toLocaleString()}
            </Text>
          </div>
          {inquiry.resolved_at && (
            <div>
              <Label>Resolved At</Label>
              <Text className="text-ui-fg-subtle">
                {new Date(inquiry.resolved_at).toLocaleString()}
              </Text>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};
