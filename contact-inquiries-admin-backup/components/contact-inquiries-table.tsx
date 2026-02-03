import { useEffect, useState } from "react";
import { Table, Badge, Button, Text, Container } from "@medusajs/ui";
import { PencilSquare, Trash } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";

type ContactInquiry = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string | null;
  status: "new" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

const statusColors = {
  new: "blue",
  in_progress: "orange",
  resolved: "green",
  closed: "grey",
} as const;

export const ContactInquiriesTable = () => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/admin/contact-inquiries", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/contact-inquiries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete inquiry");
      }

      setInquiries(inquiries.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete inquiry");
    }
  };

  if (loading) {
    return (
      <Container>
        <Text>Loading inquiries...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Text className="text-red-500">Error: {error}</Text>
      </Container>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Container>
        <Text className="text-ui-fg-subtle">No contact inquiries yet.</Text>
      </Container>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Subject</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {inquiries.map((inquiry) => (
            <Table.Row
              key={inquiry.id}
              className="cursor-pointer hover:bg-ui-bg-subtle-hover"
              onClick={() => navigate(`/contact-inquiries/${inquiry.id}`)}
            >
              <Table.Cell>
                {inquiry.first_name} {inquiry.last_name}
              </Table.Cell>
              <Table.Cell>{inquiry.email}</Table.Cell>
              <Table.Cell>{inquiry.subject || "—"}</Table.Cell>
              <Table.Cell>
                <Badge color={statusColors[inquiry.status]}>
                  {inquiry.status.replace("_", " ")}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {new Date(inquiry.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/contact-inquiries/${inquiry.id}`);
                    }}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(inquiry.id);
                    }}
                  >
                    <Trash className="text-red-500" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
