import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { sdk } from "../../lib/sdk";

/**
 * Admin UI: Product Reviews Management
 * Lists all reviews with approve/reject actions
 */
const ReviewsPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const response = await sdk.client.fetch(`/admin/reviews${params}`);
      setReviews(response.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await sdk.client.fetch("/admin/reviews/status", {
        method: "POST",
        body: { id, status },
      });
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "orange",
      approved: "green",
      rejected: "red",
    };
    return (
      <Badge color={colors[status as keyof typeof colors]}>{status}</Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Product Reviews</Heading>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "primary" : "secondary"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "primary" : "secondary"}
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "approved" ? "primary" : "secondary"}
            onClick={() => setFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={filter === "rejected" ? "primary" : "secondary"}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </Button>
        </div>
      </div>

      {loading ? (
        <div>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div>No reviews found</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product ID</Table.HeaderCell>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reviews.map((review) => (
              <Table.Row key={review.id}>
                <Table.Cell>{review.product_id}</Table.Cell>
                <Table.Cell>
                  <div>
                    <div className="font-medium">{review.title}</div>
                    <div className="text-sm text-gray-500">
                      {review.content}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{getRatingStars(review.rating)}</Table.Cell>
                <Table.Cell>
                  {review.first_name} {review.last_name}
                </Table.Cell>
                <Table.Cell>{getStatusBadge(review.status)}</Table.Cell>
                <Table.Cell>
                  {review.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() =>
                          updateReviewStatus(review.id, "approved")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() =>
                          updateReviewStatus(review.id, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Reviews",
  icon: "star",
});

export default ReviewsPage;
