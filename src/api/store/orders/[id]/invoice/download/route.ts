import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import PDFDocument from "pdfkit";

/**
 * GET /store/orders/:id/invoice/download
 *
 * Download professional invoice PDF for an order
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const orderId = req.params.id;

    console.log("[Invoice Download] Generating PDF for order:", orderId);

    // Get order details using Query
    const query = req.scope.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "currency_code",
        "created_at",
        "items.*",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "shipping_address.*",
        "billing_address.*",
      ],
      filters: { id: orderId },
    });

    if (!orders || orders.length === 0) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const order = orders[0];

    // Helper function to extract numeric value from BigNumber objects
    const getNumericValue = (value: any): number => {
      if (value && typeof value === "object" && "numeric_" in value) {
        return Number(value.numeric_);
      }
      return Number(value) || 0;
    };

    // Get company details from environment variables
    const companyName =
      process.env.INVOICE_COMPANY_NAME ||
      "SixthGear MotoSupply and cafe + lounge";
    const companyAddress =
      process.env.INVOICE_COMPANY_ADDRESS ||
      "123 Main Street, Manila, Philippines";
    const companyPhone =
      process.env.INVOICE_COMPANY_PHONE || "+63 123 456 7890";
    const companyEmail =
      process.env.INVOICE_COMPANY_EMAIL || "orders@sixthgearmoto.com";
    const invoiceNotes =
      process.env.INVOICE_NOTES ||
      "Thank you for your business! For questions, contact us at support@sixthgearmoto.com";

    // Format currency
    const formatPrice = (amount: any) => {
      const numericValue = getNumericValue(amount);
      return `PHP ${numericValue.toFixed(2)}`;
    };

    // Format order number as SIX-XXXXXX
    const displayId = getNumericValue(order.display_id);
    const orderNumber = `SIX-${displayId.toString().padStart(6, "0")}`;

    // Generate 10-digit invoice number from display_id
    const invoiceNumber = displayId.toString().padStart(10, "0");

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${orderNumber}.pdf"`,
      );
      res.send(pdfBuffer);
    });

    // Colors
    const primaryColor = "#F16D34";
    const darkGray = "#333333";
    const lightGray = "#666666";
    const borderColor = "#DDDDDD";

    // Header with company name
    doc
      .fontSize(20)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text(companyName.toUpperCase(), 50, 50, { width: 300 });

    doc
      .fontSize(10)
      .fillColor(lightGray)
      .font("Helvetica")
      .text(companyAddress, 50, 80)
      .text(companyPhone, 50, 95)
      .text(companyEmail, 50, 110);

    // Invoice title and number (right aligned)
    doc
      .fontSize(28)
      .fillColor(darkGray)
      .font("Helvetica-Bold")
      .text("INVOICE", 350, 50, { width: 195, align: "right" });

    doc
      .fontSize(10)
      .fillColor(lightGray)
      .font("Helvetica")
      .text(`Invoice #: INV-${invoiceNumber}`, 350, 85, {
        width: 195,
        align: "right",
      })
      .text(`Order #: ${orderNumber}`, 350, 100, {
        width: 195,
        align: "right",
      })
      .text(
        `Date: ${new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        350,
        115,
        { width: 195, align: "right" },
      );

    // Horizontal line
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 145)
      .lineTo(545, 145)
      .stroke();

    // Bill To section
    let yPos = 170;
    doc
      .fontSize(12)
      .fillColor(darkGray)
      .font("Helvetica-Bold")
      .text("BILL TO:", 50, yPos);

    yPos += 20;
    if (order.billing_address) {
      doc
        .fontSize(10)
        .fillColor(darkGray)
        .font("Helvetica")
        .text(
          `${order.billing_address.first_name || ""} ${order.billing_address.last_name || ""}`,
          50,
          yPos,
        );
      yPos += 15;

      if (order.email) {
        doc.text(order.email, 50, yPos);
        yPos += 15;
      }

      if (order.billing_address.address_1) {
        doc.text(order.billing_address.address_1, 50, yPos);
        yPos += 15;
      }

      if (order.billing_address.city) {
        const cityLine = [
          order.billing_address.city,
          order.billing_address.province,
          order.billing_address.postal_code,
        ]
          .filter(Boolean)
          .join(", ");
        doc.text(cityLine, 50, yPos);
        yPos += 15;
      }

      if (order.billing_address.phone) {
        doc.text(order.billing_address.phone, 50, yPos);
        yPos += 15;
      }
    }

    // Ship To section (if different from billing)
    if (order.shipping_address) {
      doc
        .fontSize(12)
        .fillColor(darkGray)
        .font("Helvetica-Bold")
        .text("SHIP TO:", 300, 170);

      let shipYPos = 190;
      doc
        .fontSize(10)
        .fillColor(darkGray)
        .font("Helvetica")
        .text(
          `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`,
          300,
          shipYPos,
          { width: 245 },
        );
      shipYPos += 15;

      if (order.shipping_address.address_1) {
        doc.text(order.shipping_address.address_1, 300, shipYPos, {
          width: 245,
        });
        shipYPos += 15;
      }

      if (order.shipping_address.city) {
        const cityLine = [
          order.shipping_address.city,
          order.shipping_address.province,
          order.shipping_address.postal_code,
        ]
          .filter(Boolean)
          .join(", ");
        doc.text(cityLine, 300, shipYPos, { width: 245 });
        shipYPos += 15;
      }

      if (order.shipping_address.phone) {
        doc.text(order.shipping_address.phone, 300, shipYPos, { width: 245 });
      }
    }

    // Items table
    yPos = Math.max(yPos, 290) + 20;

    // Table header
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

    yPos += 10;
    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font("Helvetica-Bold")
      .text("ITEM", 50, yPos)
      .text("QTY", 330, yPos, { width: 40, align: "center" })
      .text("UNIT PRICE", 380, yPos, { width: 75, align: "right" })
      .text("AMOUNT", 465, yPos, { width: 80, align: "right" });

    yPos += 15;
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

    // Table items
    yPos += 10;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const quantity = getNumericValue(item.quantity);
        const unitPrice = getNumericValue(item.unit_price);
        const total = getNumericValue(item.total);

        doc
          .fontSize(10)
          .fillColor(darkGray)
          .font("Helvetica")
          .text(item.title || "Item", 50, yPos, { width: 270 })
          .text(quantity.toString(), 330, yPos, {
            width: 40,
            align: "center",
          })
          .text(formatPrice(unitPrice), 380, yPos, {
            width: 75,
            align: "right",
          })
          .text(formatPrice(total), 465, yPos, {
            width: 80,
            align: "right",
          });

        yPos += 25;
      });
    }

    // Bottom line
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

    // Totals section
    yPos += 20;
    const totalsLabelX = 380;
    const totalsValueX = 465;

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font("Helvetica")
      .text("Subtotal:", totalsLabelX, yPos)
      .text(formatPrice(order.subtotal), totalsValueX, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 20;
    doc
      .text("Shipping:", totalsLabelX, yPos)
      .text(formatPrice(order.shipping_total || 0), totalsValueX, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 20;
    doc
      .text("Tax:", totalsLabelX, yPos)
      .text(formatPrice(order.tax_total || 0), totalsValueX, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 15;
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(380, yPos)
      .lineTo(545, yPos)
      .stroke();

    yPos += 15;
    doc
      .fontSize(12)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text("TOTAL:", totalsLabelX, yPos)
      .text(formatPrice(order.total), totalsValueX, yPos, {
        width: 80,
        align: "right",
      });

    // Notes section
    yPos += 50;
    if (yPos < 650) {
      doc
        .fontSize(10)
        .fillColor(lightGray)
        .font("Helvetica-Oblique")
        .text(invoiceNotes, 50, yPos, { width: 495, align: "center" });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor(lightGray)
      .font("Helvetica")
      .text(
        `This is a computer-generated invoice. No signature required.`,
        50,
        750,
        { align: "center", width: 495 },
      );

    doc.end();
  } catch (error: any) {
    console.error("[Invoice Download] Error:", error);
    res.status(500).json({
      message: "Failed to download invoice",
      error: error.message,
    });
  }
}
