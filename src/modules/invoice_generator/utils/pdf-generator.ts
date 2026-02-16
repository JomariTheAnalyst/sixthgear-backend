import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";

/**
 * PDF Generator Utility
 *
 * Generates professional PDF invoices using pdfmake
 */

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: "node_modules/pdfmake/build/vfs_fonts.js",
    bold: "node_modules/pdfmake/build/vfs_fonts.js",
    italics: "node_modules/pdfmake/build/vfs_fonts.js",
    bolditalics: "node_modules/pdfmake/build/vfs_fonts.js",
  },
};

interface InvoiceData {
  invoiceNumber: string;
  order: any;
  config: any;
}

/**
 * Format currency to PHP
 */
function formatCurrency(amount: number, currencyCode: string = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100);
}

/**
 * Format date to Philippine locale
 */
function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate invoice PDF document definition
 */
export function generateInvoiceDocDefinition(
  data: InvoiceData,
): TDocumentDefinitions {
  const { invoiceNumber, order, config } = data;

  // Detect payment method
  const isCOD =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ===
      "pp_system_default" ||
    order.metadata?.payment_provider === "pp_system_default";

  const paymentMethod = isCOD ? "Cash on Delivery (COD)" : "Online Payment";
  const paymentStatus =
    order.payment_status === "captured" ? "Paid" : "Pending";

  // Build items table
  const itemsTableBody: any[] = [
    [
      {
        text: "Item",
        style: "tableHeader",
        fillColor: "#F16D34",
        color: "#ffffff",
      },
      {
        text: "Quantity",
        style: "tableHeader",
        alignment: "center",
        fillColor: "#F16D34",
        color: "#ffffff",
      },
      {
        text: "Unit Price",
        style: "tableHeader",
        alignment: "right",
        fillColor: "#F16D34",
        color: "#ffffff",
      },
      {
        text: "Total",
        style: "tableHeader",
        alignment: "right",
        fillColor: "#F16D34",
        color: "#ffffff",
      },
    ],
  ];

  // Add order items
  order.items?.forEach((item: any) => {
    const unitPrice = item.unit_price || 0;
    const quantity = item.quantity || 0;
    const total = item.total || unitPrice * quantity;

    itemsTableBody.push([
      {
        text: [
          { text: item.title || item.product_title || "Product", bold: true },
          item.variant_title ? `\n${item.variant_title}` : "",
        ],
      },
      { text: quantity.toString(), alignment: "center" },
      {
        text: formatCurrency(unitPrice, order.currency_code),
        alignment: "right",
      },
      { text: formatCurrency(total, order.currency_code), alignment: "right" },
    ]);
  });

  // Build document definition
  const docDefinition: TDocumentDefinitions = {
    content: [
      // Header with logo and company info
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: config.company_name || "SixthGear Coffee",
                style: "companyName",
              },
              { text: config.company_address || "", style: "companyInfo" },
              { text: config.company_phone || "", style: "companyInfo" },
              { text: config.company_email || "", style: "companyInfo" },
              config.tax_id
                ? { text: `Tax ID: ${config.tax_id}`, style: "companyInfo" }
                : {},
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "INVOICE", style: "invoiceTitle", alignment: "right" },
              {
                text: `#${invoiceNumber}`,
                style: "invoiceNumber",
                alignment: "right",
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Invoice and order details
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Bill To:", style: "sectionHeader" },
              { text: order.email || "N/A", style: "customerInfo" },
              order.shipping_address
                ? {
                    text: [
                      `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}\n`,
                      `${order.shipping_address.address_1 || ""}\n`,
                      order.shipping_address.address_2
                        ? `${order.shipping_address.address_2}\n`
                        : "",
                      `${order.shipping_address.city || ""}, ${order.shipping_address.province || ""} ${order.shipping_address.postal_code || ""}\n`,
                      `${order.shipping_address.country_code?.toUpperCase() || ""}`,
                    ],
                    style: "customerInfo",
                  }
                : {},
            ],
          },
          {
            width: "auto",
            stack: [
              {
                text: `Order Date: ${formatDate(order.created_at)}`,
                style: "orderInfo",
                alignment: "right",
              },
              {
                text: `Order #: ${order.custom_display_id || order.display_id || order.id}`,
                style: "orderInfo",
                alignment: "right",
              },
              {
                text: `Payment Method: ${paymentMethod}`,
                style: "orderInfo",
                alignment: "right",
              },
              {
                text: `Payment Status: ${paymentStatus}`,
                style: "orderInfo",
                alignment: "right",
              },
            ],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: itemsTableBody,
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: (i: number) =>
            i === 0 || i === 1 ? "#F16D34" : "#e0e0e0",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        margin: [0, 0, 0, 20],
      },

      // Totals section
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 200,
            stack: [
              {
                columns: [
                  { text: "Subtotal:", style: "totalLabel" },
                  {
                    text: formatCurrency(
                      order.subtotal || 0,
                      order.currency_code,
                    ),
                    style: "totalValue",
                    alignment: "right",
                  },
                ],
                margin: [0, 0, 0, 5],
              },
              order.discount_total > 0
                ? {
                    columns: [
                      { text: "Discount:", style: "totalLabel" },
                      {
                        text: `- ${formatCurrency(order.discount_total, order.currency_code)}`,
                        style: "totalValue",
                        alignment: "right",
                        color: "#16a34a",
                      },
                    ],
                    margin: [0, 0, 0, 5],
                  }
                : {},
              {
                columns: [
                  { text: "Shipping:", style: "totalLabel" },
                  {
                    text: formatCurrency(
                      order.shipping_total || 0,
                      order.currency_code,
                    ),
                    style: "totalValue",
                    alignment: "right",
                  },
                ],
                margin: [0, 0, 0, 5],
              },
              {
                columns: [
                  { text: "Tax:", style: "totalLabel" },
                  {
                    text: formatCurrency(
                      order.tax_total || 0,
                      order.currency_code,
                    ),
                    style: "totalValue",
                    alignment: "right",
                  },
                ],
                margin: [0, 0, 0, 10],
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: "#F16D34",
                  },
                ],
                margin: [0, 0, 0, 10],
              },
              {
                columns: [
                  { text: "Total:", style: "grandTotalLabel" },
                  {
                    text: formatCurrency(order.total || 0, order.currency_code),
                    style: "grandTotalValue",
                    alignment: "right",
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // COD Payment Notice
      isCOD
        ? {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    stack: [
                      {
                        text: "💰 Cash on Delivery - Payment Instructions",
                        style: "codHeader",
                      },
                      {
                        text: `Please prepare the exact amount for payment upon delivery: ${formatCurrency(order.total, order.currency_code)}`,
                        style: "codText",
                      },
                    ],
                    fillColor: "#fef3c7",
                    margin: [10, 10, 10, 10],
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 0, 0, 20],
          }
        : {},

      // Footer notes
      config.invoice_notes
        ? {
            text: config.invoice_notes,
            style: "notes",
            margin: [0, 20, 0, 0],
          }
        : {},

      // Thank you message
      {
        text: "Thank you for your business!",
        style: "thankYou",
        alignment: "center",
        margin: [0, 30, 0, 0],
      },
    ],

    // Styles
    styles: {
      companyName: {
        fontSize: 20,
        bold: true,
        color: "#F16D34",
        margin: [0, 0, 0, 5],
      },
      companyInfo: {
        fontSize: 9,
        color: "#666666",
        margin: [0, 2, 0, 0],
      },
      invoiceTitle: {
        fontSize: 28,
        bold: true,
        color: "#F16D34",
      },
      invoiceNumber: {
        fontSize: 14,
        color: "#666666",
        margin: [0, 5, 0, 0],
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: "#333333",
        margin: [0, 0, 0, 8],
      },
      customerInfo: {
        fontSize: 10,
        color: "#666666",
        lineHeight: 1.3,
      },
      orderInfo: {
        fontSize: 10,
        color: "#666666",
        margin: [0, 2, 0, 0],
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
      },
      totalLabel: {
        fontSize: 10,
        color: "#666666",
      },
      totalValue: {
        fontSize: 10,
        color: "#333333",
      },
      grandTotalLabel: {
        fontSize: 14,
        bold: true,
        color: "#333333",
      },
      grandTotalValue: {
        fontSize: 14,
        bold: true,
        color: "#F16D34",
      },
      codHeader: {
        fontSize: 12,
        bold: true,
        color: "#92400e",
        margin: [0, 0, 0, 5],
      },
      codText: {
        fontSize: 10,
        color: "#78350f",
      },
      notes: {
        fontSize: 9,
        color: "#666666",
        italics: true,
      },
      thankYou: {
        fontSize: 12,
        color: "#F16D34",
        bold: true,
      },
    },

    // Page settings
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],

    // Document info
    info: {
      title: `Invoice ${invoiceNumber}`,
      author: config.company_name || "SixthGear Coffee",
      subject: `Invoice for Order ${order.display_id || order.id}`,
      keywords: "invoice, order, receipt",
    },
  };

  return docDefinition;
}

/**
 * Generate PDF buffer from document definition
 */
export async function generatePdfBuffer(
  docDefinition: TDocumentDefinitions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      const chunks: Buffer[] = [];

      pdfDoc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      pdfDoc.on("error", (error: Error) => {
        reject(error);
      });

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
